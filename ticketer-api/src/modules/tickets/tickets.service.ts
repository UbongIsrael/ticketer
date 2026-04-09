import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Ticket } from './entities/ticket.entity';
import { InventoryService } from './inventory.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    private inventoryService: InventoryService,
    @InjectQueue('ticket-expiry') private ticketExpiryQueue: Queue,
  ) {}

  async reserve(userId: string, eventId: string, tierId: string) {
    await this.inventoryService.reserveTicket(eventId, tierId);

    const ticket = this.ticketRepo.create({
      owner_id: userId,
      event_id: eventId,
      tier_id: tierId,
      status: 'RESERVED',
      reserved_at: new Date(),
      expires_at: new Date(Date.now() + 10 * 60000),
    });
    await this.ticketRepo.save(ticket);

    await this.ticketExpiryQueue.add('expire-ticket', {
      ticketId: ticket.id,
      eventId: eventId,
      tierId: tierId,
    }, {
      delay: 10 * 60000,
      jobId: `expire-${ticket.id}`
    });

    return ticket;
  }

  async transition(ticketId: string, newState: string, extraData: any = {}) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId }});
    if (!ticket) throw new NotFoundException('Ticket not found');

    const validTransitions: Record<string, string[]> = {
      'AVAILABLE': ['RESERVED', 'CANCELLED', 'EVENT_EXPIRED'],
      'RESERVED': ['AVAILABLE', 'PAYMENT_PENDING', 'VOIDED', 'CANCELLED', 'EVENT_EXPIRED'],
      'PAYMENT_PENDING': ['AVAILABLE', 'PAID', 'VOIDED', 'CANCELLED'],

      'PAID': ['ISSUED', 'VOID_PENDING', 'CANCELLED'],
      'ISSUED': ['VALIDATED', 'VOID_PENDING', 'CANCELLED'],
      'VOID_PENDING': ['VOIDED', 'VOID_FAILED'],
      'VOID_FAILED': ['VOID_PENDING'],
      'VALIDATED': [],
      'VOIDED': [],
      'CANCELLED': [],
      'EVENT_EXPIRED': []
    };

    const currentUpper = ticket.status.toUpperCase();
    const newUpper = newState.toUpperCase();

    if (!validTransitions[currentUpper]?.includes(newUpper)) {
      throw new BadRequestException(`Cannot transition ticket from ${currentUpper} to ${newUpper}`);
    }

    ticket.status = newUpper;
    
    if (newUpper === 'VOIDED') {
      ticket.voided_at = new Date();
    } else if (newUpper === 'PAID') {
      ticket.paid_at = new Date();
      ticket.payment_id = extraData.payment_id;
    } else if (newUpper === 'ISSUED') {
      ticket.issued_at = new Date();
      ticket.ticket_code = extraData.ticket_code;
      ticket.qr_payload = extraData.qr_payload;
      await this.inventoryService.addValidTicket(ticket.event_id, ticket.id);
    } else if (newUpper === 'VALIDATED') {
      ticket.validated_at = new Date();
    }

    await this.ticketRepo.save(ticket);
    return ticket;
  }

  async cancelReservation(ticketId: string, userId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.owner_id !== userId) throw new BadRequestException('Not your ticket');

    const upper = ticket.status.toUpperCase();
    if (upper !== 'RESERVED' && upper !== 'PAYMENT_PENDING') {
      throw new BadRequestException('Ticket cannot be cancelled at this stage');
    }

    await this.transition(ticketId, 'AVAILABLE');
    await this.inventoryService.releaseTicket(ticket.event_id, ticket.tier_id);

    // Remove the BullMQ expiry job since the ticket was manually cancelled
    await this.ticketExpiryQueue.remove(`expire-${ticketId}`);

    return { message: 'Reservation cancelled' };
  }

  async restockInventory(eventId: string, tierId: string) {
    await this.inventoryService.releaseTicket(eventId, tierId);
    const newDoc = this.ticketRepo.create({
      event_id: eventId,
      tier_id: tierId,
      status: 'AVAILABLE'
    });
    await this.ticketRepo.save(newDoc);
  }

  @Cron('0 */5 * * * *')
  async sweepStuckReservations() {
     const now = new Date();
     const stuckReserved = await this.ticketRepo.find({ where: { expires_at: LessThan(now), status: 'RESERVED' } });
     const stuckPending = await this.ticketRepo.find({ where: { expires_at: LessThan(now), status: 'PAYMENT_PENDING' } });
     const stuck = [...stuckReserved, ...stuckPending];
     for (const t of stuck) {
        await this.transition(t.id, 'AVAILABLE');
        await this.inventoryService.releaseTicket(t.event_id, t.tier_id);
     }
  }

  async getMyTickets(userId: string) {
    return this.ticketRepo.find({
      where: { owner_id: userId },
      order: { created_at: 'DESC' },
      relations: ['event', 'tier']
    });
  }
}
