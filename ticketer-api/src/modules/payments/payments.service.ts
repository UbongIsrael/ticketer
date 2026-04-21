import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { Payment } from './entities/payment.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketTier } from '../events/entities/ticket-tier.entity';
import { TicketsService } from '../tickets/tickets.service';
import { PricingService } from '../pricing/pricing.service';
import { ConfigService } from '@nestjs/config';
import { generateTicketCode } from '../../common/utils/ticket-code.util';
import { generateQrPayload } from '../../common/utils/qr.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentEvent) private eventRepo: Repository<PaymentEvent>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketTier) private tierRepo: Repository<TicketTier>,
    private ticketsService: TicketsService,
    private pricingService: PricingService,
    private configService: ConfigService,
  ) {}

  async initializePayment(userId: string, ticketIds: string[]) {
    if (!ticketIds || ticketIds.length === 0) {
      throw new BadRequestException('No ticket IDs provided');
    }

    const tickets = await this.ticketRepo.find({ where: { id: In(ticketIds) }});
    if (tickets.length !== ticketIds.length) throw new NotFoundException('Some tickets were not found');
    
    let totalTicketPrice = 0;
    let totalFee = 0;

    for (const ticket of tickets) {
      if (ticket.status.toUpperCase() !== 'RESERVED') throw new BadRequestException('Ticket is not reserved');
      
      const tier = await this.tierRepo.findOne({ where: { id: ticket.tier_id }});
      if (!tier) throw new NotFoundException('Tier not found');
      
      const ticketPrice = tier.price_minor; 
      const fee = await this.pricingService.calculateBuyerServiceFee(ticketPrice); 
      
      totalTicketPrice += ticketPrice;
      totalFee += fee;
    }

    const totalAmount = totalTicketPrice + totalFee;

    const payment = this.paymentRepo.create({
      user_id: userId,
      ticket_ids: ticketIds,
      ticket_price_minor: totalTicketPrice,
      buyer_service_fee_minor: totalFee,
      total_charged_minor: totalAmount,
      provider: 'paystack',
      payment_channel: 'card',
      provider_reference: crypto.randomUUID(),
      status: 'pending',
    });
    await this.paymentRepo.save(payment);

    await Promise.all(ticketIds.map(id => this.ticketsService.transition(id, 'PAYMENT_PENDING')));

    return {
      message: 'Payment initialized',
      amount_minor: totalAmount,
      payment_id: payment.id,
      mock_checkout_url: `http://localhost:3000/mock-paystack?ref=${payment.provider_reference}`
    };
  }

  async processWebhook(payload: any, signature: string) {
    const secret = this.configService.get<string>('paystack.secretKey');
    if (secret) {
        const expectedSignature = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
        if (signature !== expectedSignature) {
            throw new BadRequestException('Invalid signature');
        }
    }

    if (payload.event !== 'charge.success') {
      return { status: 'ignored' };
    }

    const providerRef = payload.data.reference;
    const payment = await this.paymentRepo.findOne({ where: { provider_reference: providerRef } });
    if (!payment || payment.status === 'completed') {
      return { status: 'handled' };
    }

    const payEvent = this.eventRepo.create({
      provider_reference: providerRef,
      event_type: payload.event,
      payload: payload,
    });
    await this.eventRepo.save(payEvent);

    payment.status = 'completed';
    payment.completed_at = new Date();
    await this.paymentRepo.save(payment);

    const tickets = await this.ticketRepo.find({ where: { id: In(payment.ticket_ids) }});
    if (!tickets || tickets.length === 0) throw new NotFoundException('Ticket context missing');

    const qrSecret = this.configService.get<string>('app.qrSecret') || 'default-qr-key';

    for (const ticket of tickets) {
      await this.ticketsService.transition(ticket.id, 'PAID', { payment_id: payment.id });
      
      const ticketCode = generateTicketCode();
      const qrPayload = generateQrPayload(ticket.id, ticket.event_id, qrSecret);
      
      await this.ticketsService.transition(ticket.id, 'ISSUED', {
        ticket_code: ticketCode,
        qr_payload: qrPayload,
      });
    }

    return { status: 'processed' };
  }
}
