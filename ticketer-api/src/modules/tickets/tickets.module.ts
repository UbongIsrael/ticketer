import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { InventoryService } from './inventory.service';
import { TicketExpiryProcessor } from './ticket-expiry.processor';
import { Ticket } from './entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    BullModule.registerQueue({
      name: 'ticket-expiry',
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, InventoryService, TicketExpiryProcessor],
  exports: [TicketsService, InventoryService],
})
export class TicketsModule {}
