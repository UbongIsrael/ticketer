import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from './entities/refund.entity';
import { TicketsService } from '../tickets/tickets.service';
import { ConfigService } from '@nestjs/config';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Payment } from '../payments/entities/payment.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { InventoryService } from '../tickets/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PlatformConfig) private configRepo: Repository<PlatformConfig>,
    private ticketsService: TicketsService,
    private inventoryService: InventoryService,
    private notificationsService: NotificationsService,
    @InjectQueue('refund-retries') private fallbackQueue: Queue,
  ) {}

  async requestBuyback(userId: string, ticketId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId }});
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.owner_id !== userId) throw new BadRequestException('Not your ticket');
    if (ticket.status.toUpperCase() !== 'ISSUED') throw new BadRequestException('Ticket must be ISSUED');

    const event = await this.eventRepo.findOne({ where: { id: ticket.event_id }});
    if (!event) throw new NotFoundException('Event not found');

    const configRow = await this.configRepo.findOne({ where: { key: 'buyback_window_hours' }});
    const windowHours = configRow ? parseInt(configRow.value) : 48;

    const msUntilEvent = event.starts_at.getTime() - Date.now();
    if (msUntilEvent < (windowHours * 60 * 60 * 1000)) {
      throw new BadRequestException(`Buy-back closed. Event is less than ${windowHours}h away.`);
    }

    const payment = await this.paymentRepo.findOne({ where: { ticket_id: ticketId, status: 'completed' }});
    if (!payment) throw new BadRequestException('Original payment reference missing');

    const originalMinor = payment.ticket_price_minor;
    const refundMinor = Math.round(originalMinor * 0.70);
    const platformMargin = originalMinor - refundMinor;

    const refund = this.refundRepo.create({
      ticket_id: ticketId,
      user_id: userId,
      original_amount_minor: originalMinor,
      refund_amount_minor: refundMinor,
      platform_margin_minor: platformMargin,
      status: 'pending',
      provider_reference: crypto.randomUUID(),
    });
    await this.refundRepo.save(refund);

    await this.ticketsService.transition(ticketId, 'VOID_PENDING');
    await this.ticketsService.restockInventory(ticket.event_id, ticket.tier_id);

    return {
      message: 'Buy-back initialized',
      amount_minor: refundMinor,
      refund_id: refund.id,
      mock_transfer_url: `http://localhost:3000/mock-paystack/transfer?ref=${refund.provider_reference}`
    };
  }

  async processMockTransferSuccess(providerRef: string) {
    const refund = await this.refundRepo.findOne({ where: { provider_reference: providerRef }});
    if(!refund || refund.status === 'settled') return { status: 'ignored' };

    refund.status = 'settled';
    refund.settled_at = new Date();
    await this.refundRepo.save(refund);
    await this.ticketsService.transition(refund.ticket_id, 'VOIDED');

    // Notify buyer that buy-back refund has settled
    await this.notificationsService.send(refund.user_id, 'buyback_settled', {
      refund_amount_minor: refund.refund_amount_minor,
    });
    
    return { status: 'processed' };
  }

  async processMockTransferFailed(providerRef: string) {
    const refund = await this.refundRepo.findOne({ where: { provider_reference: providerRef }});
    if(!refund || refund.status === 'failed') return { status: 'ignored' };

    refund.retry_count += 1;

    if (refund.retry_count < 3) {
      await this.refundRepo.save(refund);
      const delays = [5 * 60000, 15 * 60000, 45 * 60000];
      const delay = delays[refund.retry_count - 1] || 45 * 60000;
      await this.fallbackQueue.add('retry-refund', { providerRef }, { delay });
      return { status: 'queued-retry' };
    } else {
      refund.status = 'failed';
      refund.failure_reason = 'Max retries exceeded';
      await this.refundRepo.save(refund);
      await this.ticketsService.transition(refund.ticket_id, 'VOID_FAILED');

      // Notify buyer and admin about terminal failure
      await this.notificationsService.send(refund.user_id, 'buyback_failed', {
        reason: 'Transfer failed after 3 retries. Please update your bank details.',
      });

      return { status: 'failed-terminal' };
    }
  }

  async massRefundForCancellation(eventId: string) {
    const tickets = await this.ticketRepo.find({ where: { event_id: eventId }});
    for (const t of tickets) {
      if (t.status.toUpperCase() === 'ISSUED' || t.status.toUpperCase() === 'PAID') {
         const payment = await this.paymentRepo.findOne({ where: { ticket_id: t.id, status: 'completed' }});
         if (payment) {
           const refund = this.refundRepo.create({
              ticket_id: t.id,
              user_id: t.owner_id,
              original_amount_minor: payment.ticket_price_minor,
              refund_amount_minor: payment.ticket_price_minor,
              platform_margin_minor: 0,
              status: 'pending',
              provider_reference: crypto.randomUUID(),
           });
           await this.refundRepo.save(refund);
         }
         await this.ticketsService.transition(t.id, 'CANCELLED');
      } else if (t.status.toUpperCase() === 'RESERVED' || t.status.toUpperCase() === 'PAYMENT_PENDING') {
         await this.ticketsService.transition(t.id, 'CANCELLED');
         await this.inventoryService.releaseTicket(eventId, t.tier_id);
      }
    }
  }

  async getMyRefunds(userId: string) {
    return this.refundRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }
}
