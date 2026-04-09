import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketTier } from '../events/entities/ticket-tier.entity';
import { TicketsService } from '../tickets/tickets.service';
import { PricingService } from '../pricing/pricing.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockTicketsService = () => ({
  transition: jest.fn(),
});

const mockPricingService = () => ({
  calculateBuyerServiceFee: jest.fn().mockResolvedValue(25_000), // ₦250 default fee
});

const mockConfigService = () => ({
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'paystack.secretKey') return 'test-paystack-secret';
    if (key === 'app.qrSecret')       return 'test-qr-secret';
    return null;
  }),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: ReturnType<typeof mockRepo>;
  let payEventRepo: ReturnType<typeof mockRepo>;
  let ticketRepo: ReturnType<typeof mockRepo>;
  let tierRepo: ReturnType<typeof mockRepo>;
  let ticketsSvc: ReturnType<typeof mockTicketsService>;
  let pricingSvc: ReturnType<typeof mockPricingService>;
  let configSvc: ReturnType<typeof mockConfigService>;

  function makeTicket(status = 'RESERVED', overrides: any = {}): any {
    return { id: 'ticket-uuid', tier_id: 'tier-uuid', event_id: 'event-uuid', status, ...overrides };
  }

  function makeTier(price = 500_000): any { // ₦5,000 default
    return { id: 'tier-uuid', price_minor: price };
  }

  function makePayment(status = 'pending', overrides: any = {}): any {
    return {
      id: 'pay-uuid', ticket_id: 'ticket-uuid',
      provider_reference: 'ref-123', status, ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment),      useFactory: mockRepo },
        { provide: getRepositoryToken(PaymentEvent), useFactory: mockRepo },
        { provide: getRepositoryToken(Ticket),       useFactory: mockRepo },
        { provide: getRepositoryToken(TicketTier),   useFactory: mockRepo },
        { provide: TicketsService,  useFactory: mockTicketsService },
        { provide: PricingService,  useFactory: mockPricingService },
        { provide: ConfigService,   useFactory: mockConfigService },
      ],
    }).compile();

    service       = module.get<PaymentsService>(PaymentsService);
    paymentRepo   = module.get(getRepositoryToken(Payment));
    payEventRepo  = module.get(getRepositoryToken(PaymentEvent));
    ticketRepo    = module.get(getRepositoryToken(Ticket));
    tierRepo      = module.get(getRepositoryToken(TicketTier));
    ticketsSvc    = module.get(TicketsService);
    pricingSvc    = module.get(PricingService);
    configSvc     = module.get(ConfigService);
  });

  // ─── initializePayment ────────────────────────────────────────────────────────

  describe('initializePayment()', () => {
    it('PAY-001: RESERVED ticket → creates Payment, transitions to PAYMENT_PENDING', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('RESERVED'));
      tierRepo.findOne.mockResolvedValue(makeTier(500_000));
      pricingSvc.calculateBuyerServiceFee.mockResolvedValue(25_000); // ₦250
      paymentRepo.create.mockReturnValue(makePayment());
      paymentRepo.save.mockImplementation(async (p) => p);
      ticketsSvc.transition.mockResolvedValue(undefined);

      const result = await service.initializePayment('user-id', 'ticket-uuid');

      expect(result.amount_minor).toBe(525_000); // ₦5,000 + ₦250 = ₦5,250
      expect(ticketsSvc.transition).toHaveBeenCalledWith('ticket-uuid', 'PAYMENT_PENDING');
    });

    it('PAY-003: total amount = ticket_price + buyer_service_fee', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('RESERVED'));
      tierRepo.findOne.mockResolvedValue(makeTier(1_000_000)); // ₦10,000
      pricingSvc.calculateBuyerServiceFee.mockResolvedValue(50_000); // ₦500 cap
      const capturedCreate: any[] = [];
      paymentRepo.create.mockImplementation((d: any) => { capturedCreate.push(d); return d; });
      paymentRepo.save.mockImplementation(async (p) => p);
      ticketsSvc.transition.mockResolvedValue(undefined);

      await service.initializePayment('user-id', 'ticket-uuid');

      expect(capturedCreate[0].total_charged_minor).toBe(1_050_000);     // ₦10,500
      expect(capturedCreate[0].buyer_service_fee_minor).toBe(50_000);
      expect(capturedCreate[0].ticket_price_minor).toBe(1_000_000);
    });

    it('PAY-002: throws BadRequestException if ticket status is not RESERVED', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('ISSUED'));
      await expect(service.initializePayment('user-id', 'ticket-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if ticket not found', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.initializePayment('user-id', 'ticket-uuid')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if tier not found', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket('RESERVED'));
      tierRepo.findOne.mockResolvedValue(null);
      await expect(service.initializePayment('user-id', 'ticket-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── processWebhook ───────────────────────────────────────────────────────────

  describe('processWebhook()', () => {
    const SECRET = 'test-paystack-secret';
    const REF    = 'ref-123';

    function makeValidPayload(reference = REF) {
      return { event: 'charge.success', data: { reference } };
    }

    function computeHmac(payload: object, secret: string): string {
      const crypto = require('crypto');
      return crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
    }

    it('PAY-004: valid charge.success → PAID then ISSUED, QR generated', async () => {
      const payload = makeValidPayload();
      const sig = computeHmac(payload, SECRET);

      paymentRepo.findOne.mockResolvedValue(makePayment('pending'));
      payEventRepo.create.mockReturnValue({});
      payEventRepo.save.mockImplementation(async (e) => e);
      paymentRepo.save.mockImplementation(async (p) => p);
      ticketRepo.findOne.mockResolvedValue(makeTicket('PAYMENT_PENDING'));
      ticketsSvc.transition.mockResolvedValue(undefined);

      const result = await service.processWebhook(payload, sig);

      expect(result.status).toBe('processed');
      expect(ticketsSvc.transition).toHaveBeenCalledWith('ticket-uuid', 'PAID', expect.any(Object));
      expect(ticketsSvc.transition).toHaveBeenCalledWith('ticket-uuid', 'ISSUED', expect.objectContaining({
        ticket_code: expect.stringMatching(/^EVT-\d{4}-[A-F0-9]{4}$/),
        qr_payload:  expect.stringContaining(':'),
      }));
    });

    it('PAY-005: invalid HMAC signature → throws BadRequestException', async () => {
      const payload = makeValidPayload();
      await expect(service.processWebhook(payload, 'bad-signature')).rejects.toThrow(BadRequestException);
    });

    it('PAY-006: duplicate reference (already completed) → idempotent, status: handled', async () => {
      const payload = makeValidPayload();
      const sig = computeHmac(payload, SECRET);

      paymentRepo.findOne.mockResolvedValue(makePayment('completed'));

      const result = await service.processWebhook(payload, sig);

      expect(result.status).toBe('handled');
      expect(ticketsSvc.transition).not.toHaveBeenCalled();
    });

    it('PAY-007: non-charge.success event type → status: ignored', async () => {
      const payload = { event: 'charge.failed', data: { reference: REF } };
      const sig = computeHmac(payload, SECRET);

      const result = await service.processWebhook(payload, sig);

      expect(result.status).toBe('ignored');
      expect(ticketsSvc.transition).not.toHaveBeenCalled();
    });

    it('PAY-008: payment record not found → status: handled (no crash)', async () => {
      const payload = makeValidPayload();
      const sig = computeHmac(payload, SECRET);

      paymentRepo.findOne.mockResolvedValue(null);

      const result = await service.processWebhook(payload, sig);

      expect(result.status).toBe('handled');
    });
  });
});
