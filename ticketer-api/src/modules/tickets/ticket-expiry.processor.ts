import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TicketsService } from './tickets.service';
import { InventoryService } from './inventory.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';

@Processor('ticket-expiry')
export class TicketExpiryProcessor extends WorkerHost {
  constructor(
    private ticketsService: TicketsService,
    private inventoryService: InventoryService,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { ticketId, eventId, tierId } = job.data;
    
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) return;

    if (ticket.status.toUpperCase() === 'RESERVED' || ticket.status.toUpperCase() === 'PAYMENT_PENDING') {
      await this.ticketsService.transition(ticketId, 'AVAILABLE');
      await this.inventoryService.releaseTicket(eventId, tierId);
    }
  }
}
