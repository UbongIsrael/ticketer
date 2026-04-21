import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { WeatherService } from './weather.service';
import { Event } from './entities/event.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { HostSettlement } from './entities/host-settlement.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PricingModule } from '../pricing/pricing.module';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { RefundsModule } from '../refunds/refunds.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, TicketTier, HostSettlement, ApprovalRequest, PlatformConfig, Ticket]),
    forwardRef(() => TicketsModule),
    forwardRef(() => RefundsModule),
    PricingModule,
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, WeatherService],
  exports: [EventsService, WeatherService],
})
export class EventsModule {}

