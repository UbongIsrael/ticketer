import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScanningService } from './scanning.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { ScanningGateway } from './scanning.gateway';
import { TicketsService } from '../tickets/tickets.service';
import { generateQrPayload } from '../../common/utils/qr.util';

const QR_SECRET = 'test-qr-secret-key';
const EVENT_ID  = 'event-uuid';
const TICKET_ID = 'ticket-uuid';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockRedis = () => ({
  sadd: jest.fn(),
  srem: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue(QR_SECRET),
});

const mockGateway = () => ({
  emitScan: jest.fn(),
});

const mockTicketsService = () => ({
  transition: jest.fn(),
});

describe('ScanningService', () => {
  let service: ScanningService;
  let ticketRepo: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let ticketsSvc: ReturnType<typeof mockTicketsService>;
  let gateway: ReturnType<typeof mockGateway>;

  /** Pre-generated valid QR payload using the test secret */
  const validQrPayload = generateQrPayload(TICKET_ID, EVENT_ID, QR_SECRET);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScanningService,
        { provide: getRepositoryToken(Ticket), useFactory: mockRepo },
        { provide: 'REDIS_CLIENT',  useFactory: mockRedis },
        { provide: ConfigService,   useFactory: mockConfigService },
        { provide: ScanningGateway, useFactory: mockGateway },
        { provide: TicketsService,  useFactory: mockTicketsService },
      ],
    }).compile();

    service     = module.get<ScanningService>(ScanningService);
    ticketRepo  = module.get(getRepositoryToken(Ticket));
    redis       = module.get('REDIS_CLIENT');
    ticketsSvc  = module.get(TicketsService);
    gateway     = module.get(ScanningGateway);
  });

  // ─── getManifest ─────────────────────────────────────────────────────────────

  describe('getManifest()', () => {
    it('SCAN-001: loads ISSUED tickets into Redis set and returns them', async () => {
      const tickets = [
        { id: TICKET_ID, ticket_code: 'EVT-2026-AB3F' },
        { id: 'ticket-2', ticket_code: 'EVT-2026-CD4G' },
      ];
      ticketRepo.find.mockResolvedValue(tickets);
      redis.sadd.mockResolvedValue(2);

      const result = await service.getManifest(EVENT_ID);

      expect(redis.sadd).toHaveBeenCalledWith(
        `valid_tickets:${EVENT_ID}`,
        TICKET_ID,
        'ticket-2',
      );
      expect(result).toHaveLength(2);
    });

    it('SCAN-002: returns empty array and skips Redis sadd for event with no ISSUED tickets', async () => {
      ticketRepo.find.mockResolvedValue([]);

      const result = await service.getManifest(EVENT_ID);

      expect(result).toHaveLength(0);
      expect(redis.sadd).not.toHaveBeenCalled();
    });
  });

  // ─── validateScan ─────────────────────────────────────────────────────────────

  describe('validateScan()', () => {
    it('SCAN-003: valid, first-scan QR → transitions to VALIDATED, emits WebSocket', async () => {
      redis.srem.mockResolvedValue(1); // removed from set = valid first scan
      ticketsSvc.transition.mockResolvedValue(undefined);
      gateway.emitScan.mockReturnValue(undefined);

      const result = await service.validateScan(validQrPayload);

      expect(result.status).toBe('success');
      expect(result.ticketId).toBe(TICKET_ID);
      expect(ticketsSvc.transition).toHaveBeenCalledWith(TICKET_ID, 'VALIDATED');
      expect(gateway.emitScan).toHaveBeenCalledWith(EVENT_ID, TICKET_ID);
    });

    it('SCAN-004: already-scanned ticket (SREM returns 0) → throws BadRequestException', async () => {
      redis.srem.mockResolvedValue(0);

      await expect(service.validateScan(validQrPayload)).rejects.toThrow(BadRequestException);
      await expect(service.validateScan(validQrPayload)).rejects.toThrow(/already scanned/i);
    });

    it('SCAN-005: tampered QR (wrong HMAC) → throws BadRequestException', async () => {
      const tamperedPayload = `${TICKET_ID}:${EVENT_ID}:deadbeefdeadbeef`;
      await expect(service.validateScan(tamperedPayload)).rejects.toThrow(BadRequestException);
      await expect(service.validateScan(tamperedPayload)).rejects.toThrow(/invalid qr/i);
    });

    it('SCAN-006: malformed payload (no colons) → throws BadRequestException', async () => {
      await expect(service.validateScan('notavalidqrpayload')).rejects.toThrow(BadRequestException);
    });

    it('SCAN-006b: empty string payload → throws BadRequestException', async () => {
      await expect(service.validateScan('')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── syncOfflineScans ─────────────────────────────────────────────────────────

  describe('syncOfflineScans()', () => {
    it('SCAN-007: processes mixed valid/invalid batch and returns per-scan results', async () => {
      // First scan: valid
      // Second scan: already scanned (SREM returns 0)
      redis.srem
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      ticketsSvc.transition.mockResolvedValue(undefined);
      gateway.emitScan.mockReturnValue(undefined);

      const secondPayload = generateQrPayload('ticket-2', EVENT_ID, QR_SECRET);

      const result = await service.syncOfflineScans([
        { qrPayload: validQrPayload },
        { qrPayload: secondPayload },
      ]);

      expect(result.sync_results).toHaveLength(2);
      expect(result.sync_results[0].status).toBe('success');
      expect(result.sync_results[1].status).toBe('failed');
    });

    it('does not throw on batch errors — individual failures are captured in results', async () => {
      redis.srem.mockResolvedValue(0);

      await expect(service.syncOfflineScans([{ qrPayload: validQrPayload }])).resolves.not.toThrow();
    });
  });
});
