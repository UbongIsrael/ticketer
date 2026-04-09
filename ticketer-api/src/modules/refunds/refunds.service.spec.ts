import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RefundsService } from './refunds.service';
import { Refund } from './entities/refund.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Event } from '../events/entities/event.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import { TicketsService } from '../tickets/tickets.service';
import { InventoryService } from '../tickets/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockTicketsService = () => ({
  transition: jest.fn(),
  restockInventory: jest.fn(),
});

const mockInventoryService = () => ({
  releaseTicket: jest.fn(),
});

const mockNotificationsService = () => ({
  send: jest.fn(),
});

const mockQueue = () => ({
  add: jest.fn(),
});

describe('RefundsService', () => {
  let service: RefundsService;
  let refundRepo: ReturnType<typeof mockRepo>;
  let ticketRepo: ReturnType<typeof mockRepo>;
  let eventRepo: ReturnType<typeof mockRepo>;
  let paymentRepo: ReturnType<typeof mockRepo>;
  let configRepo: ReturnType<typeof mockRepo>;
  let ticketsSvc: ReturnType<typeof mockTicketsService>;
  let inventorySvc: ReturnType<typeof mockInventoryService>;
  let notifyService: ReturnType<typeof mockNotificationsService>;
  let queue: ReturnType<typeof mockQueue>;

  const USER_ID   = 'user-uuid';
  const TICKET_ID = 'ticket-uuid';
  const EVENT_ID  = 'event-uuid';

  /** 72 hours from now (well outside the 48h window) */
  const FUTURE_START = new Date(Date.now() + 72 * 60 * 60 * 1000);
  /** 20 hours from now (inside the 48h window) */
  const SOON_START   = new Date(Date.now() + 20 * 60 * 60 * 1000);

  function makeTicket(status = 'ISSUED', overrides: any = {}): Partial<Ticket> {
    return { id: TICKET_ID, owner_id: USER_ID, event_id: EVENT_ID, tier_id: 'tier-uuid', status, ...overrides };
  }

  function makeEvent(startsAt: Date): Partial<Event> {
    return { id: EVENT_ID, starts_at: startsAt } as any;
  }

  function makePayment(ticketPriceMinor: number): Partial<Payment> {
    return { id: 'pay-uuid', ticket_id: TICKET_ID, ticket_price_minor: ticketPriceMinor, status: 'completed' } as any;
  }

  function makeConfig(hours = 48): Partial<PlatformConfig> {
    return { key: 'buyback_window_hours', value: String(hours) } as any;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
        { provide: getRepositoryToken(Refund), useFactory: mockRepo },
        { provide: getRepositoryToken(Ticket), useFactory: mockRepo },
        { provide: getRepositoryToken(Event), useFactory: mockRepo },
        { provide: getRepositoryToken(Payment), useFactory: mockRepo },
        { provide: getRepositoryToken(PlatformConfig), useFactory: mockRepo },
        { provide: TicketsService, useFactory: mockTicketsService },
        { provide: InventoryService, useFactory: mockInventoryService },
        { provide: NotificationsService, useFactory: mockNotificationsService },
        { provide: getQueueToken('refund-retries'), useFactory: mockQueue },
      ],
    }).compile();

    service       = module.get<RefundsService>(RefundsService);
    refundRepo    = module.get(getRepositoryToken(Refund));
    ticketRepo    = module.get(getRepositoryToken(Ticket));
    eventRepo     = module.get(getRepositoryToken(Event));
    paymentRepo   = module.get(getRepositoryToken(Payment));
    configRepo    = module.get(getRepositoryToken(PlatformConfig));
    ticketsSvc    = module.get(TicketsService);
    inventorySvc  = module.get(InventoryService);
    notifyService = module.get(NotificationsService);
    queue         = module.get(getQueueToken('refund-retries'));
  });

  // ─── requestBuyback ──────────────────────────────────────────────────────────

  describe('requestBuyback()', () => {
    it('REF-001: succeeds on ISSUED ticket 72h before event', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      eventRepo.findOne.mockResolvedValue(makeEvent(FUTURE_START));
      configRepo.findOne.mockResolvedValue(makeConfig(48));
      paymentRepo.findOne.mockResolvedValue(makePayment(1_000_000)); // ₦10,000

      const fakeRefund = { id: 'refund-uuid', refund_amount_minor: 700_000 };
      refundRepo.create.mockReturnValue(fakeRefund);
      refundRepo.save.mockResolvedValue(fakeRefund);
      ticketsSvc.transition.mockResolvedValue(undefined);
      ticketsSvc.restockInventory.mockResolvedValue(undefined);

      const result = await service.requestBuyback(USER_ID, TICKET_ID);

      expect(result.amount_minor).toBe(700_000);
      expect(result.refund_id).toBe('refund-uuid');
      expect(ticketsSvc.transition).toHaveBeenCalledWith(TICKET_ID, 'VOID_PENDING');
      expect(ticketsSvc.restockInventory).toHaveBeenCalled();
    });

    it('REF-005: 70% refund calculation — ₦10,000 ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      eventRepo.findOne.mockResolvedValue(makeEvent(FUTURE_START));
      configRepo.findOne.mockResolvedValue(makeConfig(48));
      paymentRepo.findOne.mockResolvedValue(makePayment(1_000_000)); // 1,000,000 kobo = ₦10,000

      const captures: any[] = [];
      refundRepo.create.mockImplementation((data: any) => { captures.push(data); return data; });
      refundRepo.save.mockImplementation(async (d) => ({ ...d, id: 'r1' }));
      ticketsSvc.transition.mockResolvedValue(undefined);
      ticketsSvc.restockInventory.mockResolvedValue(undefined);

      await service.requestBuyback(USER_ID, TICKET_ID);

      expect(captures[0].refund_amount_minor).toBe(700_000);   // 70%
      expect(captures[0].platform_margin_minor).toBe(300_000); // 30%
      expect(captures[0].original_amount_minor).toBe(1_000_000);
    });

    it('REF-002: rejects VALIDATED ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('VALIDATED'));
      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(BadRequestException);
    });

    it('REF-003: rejects when event is 20h away (inside 48h window)', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      eventRepo.findOne.mockResolvedValue(makeEvent(SOON_START));
      configRepo.findOne.mockResolvedValue(makeConfig(48));

      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(BadRequestException);
    });

    it('REF-004: rejects when user is not the owner', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED', { owner_id: 'someone-else' }));
      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when event does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      eventRepo.findOne.mockResolvedValue(null);
      configRepo.findOne.mockResolvedValue(makeConfig(48));
      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when completed payment not found', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      eventRepo.findOne.mockResolvedValue(makeEvent(FUTURE_START));
      configRepo.findOne.mockResolvedValue(makeConfig(48));
      paymentRepo.findOne.mockResolvedValue(null);
      await expect(service.requestBuyback(USER_ID, TICKET_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Transfer Success (Mock Webhook) ─────────────────────────────────────────

  describe('processMockTransferSuccess()', () => {
    const PROVIDER_REF = 'ref-123';

    it('REF-006: settles refund, voids ticket, sends notification', async () => {
      const refund = {
        id: 'refund-id', provider_reference: PROVIDER_REF,
        status: 'pending', user_id: USER_ID, ticket_id: TICKET_ID,
        refund_amount_minor: 700_000, settled_at: null,
      };
      refundRepo.findOne.mockResolvedValue(refund);
      refundRepo.save.mockImplementation(async (r) => r);
      ticketsSvc.transition.mockResolvedValue(undefined);
      notifyService.send.mockResolvedValue(undefined);

      const result = await service.processMockTransferSuccess(PROVIDER_REF);

      expect(result.status).toBe('processed');
      expect(refund.status).toBe('settled');
      expect(refund.settled_at).toBeInstanceOf(Date);
      expect(ticketsSvc.transition).toHaveBeenCalledWith(TICKET_ID, 'VOIDED');
      expect(notifyService.send).toHaveBeenCalledWith(USER_ID, 'buyback_settled', expect.any(Object));
    });

    it('REF-007: duplicate success webhook is ignored (idempotent)', async () => {
      refundRepo.findOne.mockResolvedValue({
        status: 'settled', provider_reference: PROVIDER_REF,
      });

      const result = await service.processMockTransferSuccess(PROVIDER_REF);

      expect(result.status).toBe('ignored');
      expect(ticketsSvc.transition).not.toHaveBeenCalled();
    });
  });

  // ─── Transfer Failed (Retry Logic) ───────────────────────────────────────────

  describe('processMockTransferFailed()', () => {
    const PROVIDER_REF = 'ref-fail';

    function makeRefund(retry_count: number, status = 'pending') {
      return {
        id: 'refund-id', provider_reference: PROVIDER_REF,
        status, user_id: USER_ID, ticket_id: TICKET_ID,
        failure_reason: null, retry_count,
      };
    }

    it('REF-008: first failure → queued to BullMQ with 5-min delay', async () => {
      const refund = makeRefund(0);
      refundRepo.findOne.mockResolvedValue(refund);
      refundRepo.save.mockImplementation(async (r) => r);
      queue.add.mockResolvedValue(undefined);

      const result = await service.processMockTransferFailed(PROVIDER_REF);

      expect(result.status).toBe('queued-retry');
      expect(queue.add).toHaveBeenCalledWith(
        'retry-refund',
        expect.any(Object),
        expect.objectContaining({ delay: 5 * 60000 }),
      );
    });

    it('REF-009: second failure → queued with 15-min delay', async () => {
      const refund = makeRefund(1);
      refundRepo.findOne.mockResolvedValue(refund);
      refundRepo.save.mockImplementation(async (r) => r);
      queue.add.mockResolvedValue(undefined);

      await service.processMockTransferFailed(PROVIDER_REF);

      expect(queue.add).toHaveBeenCalledWith(
        'retry-refund',
        expect.any(Object),
        expect.objectContaining({ delay: 15 * 60000 }),
      );
    });

    it('REF-010: third failure (max) → terminal VOID_FAILED, admin notified', async () => {
      const refund = makeRefund(2);
      refundRepo.findOne.mockResolvedValue(refund);
      refundRepo.save.mockImplementation(async (r) => r);
      ticketsSvc.transition.mockResolvedValue(undefined);
      notifyService.send.mockResolvedValue(undefined);

      const result = await service.processMockTransferFailed(PROVIDER_REF);

      expect(result.status).toBe('failed-terminal');
      expect(refund.status).toBe('failed');
      expect(refund.failure_reason).toContain('Max retries');
      expect(ticketsSvc.transition).toHaveBeenCalledWith(TICKET_ID, 'VOID_FAILED');
      expect(notifyService.send).toHaveBeenCalledWith(USER_ID, 'buyback_failed', expect.any(Object));
    });
  });

  // ─── Mass Refund (Event Cancellation) ────────────────────────────────────────

  describe('massRefundForCancellation()', () => {
    it('REF-011: creates 100% refund records for ISSUED and PAID tickets', async () => {
      const tickets = [
        makeTicket('ISSUED', { id: 't1' }),
        makeTicket('PAID',   { id: 't2' }),
        makeTicket('RESERVED', { id: 't3' }),
      ];

      ticketRepo.find.mockResolvedValue(tickets);
      paymentRepo.findOne.mockResolvedValue(makePayment(1_000_000));
      refundRepo.create.mockImplementation((d: any) => d);
      refundRepo.save.mockImplementation(async (d) => d);
      ticketsSvc.transition.mockResolvedValue(undefined);
      inventorySvc.releaseTicket.mockResolvedValue(undefined);

      await service.massRefundForCancellation(EVENT_ID);

      // ISSUED + PAID → 2 refund records
      expect(refundRepo.save).toHaveBeenCalledTimes(2);
      // All 3 tickets get cancelled
      expect(ticketsSvc.transition).toHaveBeenCalledTimes(3);
    });

    it('REF-012: RESERVED tickets are cancelled and inventory released (no refund)', async () => {
      const tickets = [makeTicket('RESERVED', { id: 't1' })];

      ticketRepo.find.mockResolvedValue(tickets);
      ticketsSvc.transition.mockResolvedValue(undefined);
      inventorySvc.releaseTicket.mockResolvedValue(undefined);

      await service.massRefundForCancellation(EVENT_ID);

      expect(inventorySvc.releaseTicket).toHaveBeenCalledWith(EVENT_ID, 'tier-uuid');
      expect(refundRepo.save).not.toHaveBeenCalled();
    });
  });
});
