import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApprovalRequest } from '../events/entities/approval-request.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { PlatformConfig } from './entities/platform-config.entity';
import { HostSettlement } from '../events/entities/host-settlement.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalRequest, Refund, PlatformConfig, HostSettlement, Event, Ticket]),
    BullModule.registerQueue({ name: 'refund-retries' }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

