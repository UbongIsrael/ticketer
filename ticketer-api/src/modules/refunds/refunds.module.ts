import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { RefundRetriesProcessor } from './refunds.processor';
import { Refund } from './entities/refund.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund, Event, Ticket, Payment, PlatformConfig]),
    BullModule.registerQueue({ name: 'refund-retries' }),
    TicketsModule,
    NotificationsModule,
  ],
  controllers: [RefundsController],
  providers: [RefundsService, RefundRetriesProcessor],
  exports: [RefundsService]
})
export class RefundsModule {}
