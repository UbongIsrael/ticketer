import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketTier } from '../events/entities/ticket-tier.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentEvent, Ticket, TicketTier]),
    TicketsModule,
    PricingModule,
  ],
  controllers: [PaymentsController, PaymentsWebhooksController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
