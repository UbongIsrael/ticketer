import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { ScanningGateway } from './scanning.gateway';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { verifyQrPayload } from '../../common/utils/qr.util';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class ScanningService {
  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private configService: ConfigService,
    private scanningGateway: ScanningGateway,
    @Inject(forwardRef(() => TicketsService)) private ticketsService: TicketsService,
  ) {}

  async getManifest(eventId: string) {
    const tickets = await this.ticketRepo.find({ where: { event_id: eventId, status: 'ISSUED' }, select: ['id', 'ticket_code'] });
    if (tickets.length > 0) {
      const ids = tickets.map(t => t.id);
      await this.redis.sadd(`valid_tickets:${eventId}`, ...ids);
    }
    return tickets;
  }

  async validateScan(qrPayload: string) {
    const secret = this.configService.get<string>('app.qrSecret') || 'default-qr-key';
    const result = verifyQrPayload(qrPayload, secret);

    if (!result.isValid || !result.ticketId || !result.eventId) {
      throw new BadRequestException('Invalid QR signature');
    }

    const ticketId = result.ticketId;
    const eventId = result.eventId;

    const removed = await this.redis.srem(`valid_tickets:${eventId}`, ticketId);
    if (removed === 0) {
      throw new BadRequestException('Ticket already scanned or invalid');
    }

    await this.ticketsService.transition(ticketId, 'VALIDATED');
    this.scanningGateway.emitScan(eventId, ticketId);
    return { status: 'success', ticketId };
  }

  async syncOfflineScans(scans: Array<{ qrPayload: string }>) {
    const results: any[] = [];
    for (const scan of scans) {
      try {
        await this.validateScan(scan.qrPayload);
        results.push({ qrPayload: scan.qrPayload, status: 'success' });
      } catch (err) {
        results.push({ qrPayload: scan.qrPayload, status: 'failed', error: err.message });
      }
    }
    return { sync_results: results };
  }
}

