import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Ticket } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { InventoryService } from './inventory.service';

/** Minimal mock factory for a TypeORM Repository */
const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockInventoryService = () => ({
  reserveTicket: jest.fn(),
  releaseTicket: jest.fn(),
  addValidTicket: jest.fn(),
});

const mockQueue = () => ({
  add: jest.fn(),
  remove: jest.fn(),
});

describe('TicketsService — State Machine', () => {
  let service: TicketsService;
  let ticketRepo: ReturnType<typeof mockRepo>;
  let inventorySvc: ReturnType<typeof mockInventoryService>;
  let queue: ReturnType<typeof mockQueue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useFactory: mockRepo },
        { provide: InventoryService, useFactory: mockInventoryService },
        { provide: getQueueToken('ticket-expiry'), useFactory: mockQueue },
      ],
    }).compile();

    service     = module.get<TicketsService>(TicketsService);
    ticketRepo  = module.get(getRepositoryToken(Ticket));
    inventorySvc = module.get(InventoryService);
    queue       = module.get(getQueueToken('ticket-expiry'));
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function makeTicket(status: string, overrides: Partial<Ticket> = {}): Ticket {
    return {
      id: 'ticket-uuid',
      event_id: 'event-uuid',
      tier_id: 'tier-uuid',
      owner_id: 'user-uuid',
      status,
      ticket_code: null,
      qr_payload: null,
      payment_id: null,
      refund_id: null,
      reserved_at: null,
      paid_at: null,
      issued_at: null,
      validated_at: null,
      voided_at: null,
      expires_at: null,
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    } as Ticket;
  }

  // ─── Valid Transitions ───────────────────────────────────────────────────────

  describe('Valid transitions', () => {
    const validCases: Array<{ id: string; from: string; to: string }> = [
      { id: 'SM-001', from: 'AVAILABLE',       to: 'RESERVED' },
      { id: 'SM-002', from: 'RESERVED',         to: 'AVAILABLE' },
      { id: 'SM-003', from: 'RESERVED',         to: 'PAYMENT_PENDING' },
      { id: 'SM-004', from: 'PAYMENT_PENDING',  to: 'PAID' },
      { id: 'SM-005', from: 'PAID',             to: 'ISSUED' },
      { id: 'SM-006', from: 'ISSUED',           to: 'VALIDATED' },
      { id: 'SM-007', from: 'ISSUED',           to: 'VOID_PENDING' },
      { id: 'SM-008', from: 'VOID_PENDING',     to: 'VOIDED' },
      { id: 'SM-009', from: 'VOID_PENDING',     to: 'VOID_FAILED' },
      { id: 'SM-010', from: 'VOID_FAILED',      to: 'VOID_PENDING' },
      { id: 'SM-011', from: 'ISSUED',           to: 'CANCELLED' },
      { id: 'SM-012', from: 'RESERVED',         to: 'AVAILABLE' },
      { id: 'SM-013', from: 'PAYMENT_PENDING',  to: 'AVAILABLE' },
    ];

    validCases.forEach(({ id, from, to }) => {
      it(`${id}: ${from} → ${to} succeeds`, async () => {
        ticketRepo.findOne.mockResolvedValue(makeTicket(from));
        ticketRepo.save.mockImplementation(async (t) => t);

        await expect(service.transition('ticket-uuid', to)).resolves.not.toThrow();
      });
    });
  });

  // ─── Invalid Transitions ─────────────────────────────────────────────────────

  describe('Invalid transitions (must throw BadRequestException)', () => {
    const invalidCases: Array<{ id: string; from: string; to: string }> = [
      { id: 'SM-020', from: 'VALIDATED',       to: 'ISSUED' },
      { id: 'SM-021', from: 'VOIDED',          to: 'ISSUED' },
      { id: 'SM-022', from: 'CANCELLED',       to: 'RESERVED' },
      { id: 'SM-023', from: 'AVAILABLE',       to: 'ISSUED' },
      { id: 'SM-024', from: 'ISSUED',          to: 'PAID' },
      { id: 'SM-025', from: 'VOID_FAILED',     to: 'VOIDED' },
      { id: 'SM-026', from: 'PAYMENT_PENDING', to: 'VOID_PENDING' },
    ];

    invalidCases.forEach(({ id, from, to }) => {
      it(`${id}: ${from} → ${to} throws BadRequestException`, async () => {
        ticketRepo.findOne.mockResolvedValue(makeTicket(from));
        await expect(service.transition('ticket-uuid', to)).rejects.toThrow(BadRequestException);
      });
    });
  });

  // ─── Timestamp Side Effects ──────────────────────────────────────────────────

  describe('Timestamp side effects', () => {
    it('SM-030: → PAID sets paid_at and payment_id', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('PAYMENT_PENDING'));
      let saved: any;
      ticketRepo.save.mockImplementation(async (t) => { saved = t; return t; });

      await service.transition('ticket-uuid', 'PAID', { payment_id: 'pay-uuid' });

      expect(saved.paid_at).toBeInstanceOf(Date);
      expect(saved.payment_id).toBe('pay-uuid');
    });

    it('SM-031: → ISSUED sets issued_at, ticket_code, qr_payload', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('PAID'));
      inventorySvc.addValidTicket.mockResolvedValue(undefined);
      let saved: any;
      ticketRepo.save.mockImplementation(async (t) => { saved = t; return t; });

      await service.transition('ticket-uuid', 'ISSUED', {
        ticket_code: 'EVT-2026-AB3F',
        qr_payload: 'ticket-uuid:event-uuid:hmac',
      });

      expect(saved.issued_at).toBeInstanceOf(Date);
      expect(saved.ticket_code).toBe('EVT-2026-AB3F');
      expect(saved.qr_payload).toBe('ticket-uuid:event-uuid:hmac');
    });

    it('SM-032: → ISSUED also calls addValidTicket on Redis', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('PAID'));
      ticketRepo.save.mockImplementation(async (t) => t);
      inventorySvc.addValidTicket.mockResolvedValue(undefined);

      await service.transition('ticket-uuid', 'ISSUED', {
        ticket_code: 'EVT-2026-XXXX',
        qr_payload: 'p',
      });

      expect(inventorySvc.addValidTicket).toHaveBeenCalledWith('event-uuid', 'ticket-uuid');
    });

    it('SM-033: → VALIDATED sets validated_at', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      let saved: any;
      ticketRepo.save.mockImplementation(async (t) => { saved = t; return t; });

      await service.transition('ticket-uuid', 'VALIDATED');

      expect(saved.validated_at).toBeInstanceOf(Date);
    });

    it('SM-034: → VOIDED sets voided_at', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('VOID_PENDING'));
      let saved: any;
      ticketRepo.save.mockImplementation(async (t) => { saved = t; return t; });

      await service.transition('ticket-uuid', 'VOIDED');

      expect(saved.voided_at).toBeInstanceOf(Date);
    });
  });

  // ─── Reserve ─────────────────────────────────────────────────────────────────

  describe('reserve()', () => {
    it('SM-001b: decrements inventory and creates RESERVED ticket', async () => {
      inventorySvc.reserveTicket.mockResolvedValue(undefined);
      const fakeTicket = makeTicket('RESERVED');
      ticketRepo.create.mockReturnValue(fakeTicket);
      ticketRepo.save.mockResolvedValue(fakeTicket);
      queue.add.mockResolvedValue(undefined);

      const result = await service.reserve('user-id', 'event-id', 'tier-id');

      expect(inventorySvc.reserveTicket).toHaveBeenCalledWith('event-id', 'tier-id');
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'expire-ticket',
        expect.objectContaining({ ticketId: fakeTicket.id }),
        expect.objectContaining({ delay: 600_000 }),
      );
      expect(result.status).toBe('RESERVED');
    });
  });

  // ─── Cancel Reservation ───────────────────────────────────────────────────────

  describe('cancelReservation()', () => {
    it('SM-002b: cancels own RESERVED ticket, releases inventory, removes BullMQ job', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('RESERVED'));
      ticketRepo.save.mockImplementation(async (t) => t);
      inventorySvc.releaseTicket.mockResolvedValue(undefined);
      queue.remove.mockResolvedValue(undefined);

      await service.cancelReservation('ticket-uuid', 'user-uuid');

      expect(inventorySvc.releaseTicket).toHaveBeenCalledWith('event-uuid', 'tier-uuid');
      expect(queue.remove).toHaveBeenCalledWith('expire-ticket-uuid');
    });

    it('throws BadRequestException when trying to cancel someone else\'s ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('RESERVED', { owner_id: 'other-user' }));
      await expect(service.cancelReservation('ticket-uuid', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when ticket is already ISSUED (not cancellable)', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      await expect(service.cancelReservation('ticket-uuid', 'user-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.cancelReservation('ticket-uuid', 'user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Sweep Stuck Reservations (Cron) ─────────────────────────────────────────

  describe('sweepStuckReservations()', () => {
    it('transitions overdue RESERVED tickets to AVAILABLE and releases inventory', async () => {
      const stuckReserved = [makeTicket('RESERVED', { id: 't1' })];
      const stuckPending  = [makeTicket('PAYMENT_PENDING', { id: 't2', tier_id: 'tier-uuid' })];

      ticketRepo.find
        .mockResolvedValueOnce(stuckReserved)
        .mockResolvedValueOnce(stuckPending);

      ticketRepo.findOne
        .mockResolvedValueOnce(makeTicket('RESERVED', { id: 't1' }))
        .mockResolvedValueOnce(makeTicket('PAYMENT_PENDING', { id: 't2' }));

      ticketRepo.save.mockImplementation(async (t) => t);
      inventorySvc.releaseTicket.mockResolvedValue(undefined);

      await service.sweepStuckReservations();

      expect(inventorySvc.releaseTicket).toHaveBeenCalledTimes(2);
    });
  });
});
