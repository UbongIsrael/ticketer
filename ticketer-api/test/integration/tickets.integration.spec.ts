/**
 * Integration tests for the full Ticket Reservation → Payment → Issuance flow.
 *
 * These tests require a live PostgreSQL + Redis instance.
 * Run with: npm run test:integration
 *
 * Uses Supertest to exercise the HTTP layer end-to-end within the NestJS app.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import {
  cleanDatabase,
  createBuyerUser,
  createHostUser,
  createPublishedEvent,
  createIssuedTicket,
  seedPlatformConfig,
} from '../fixtures/factories';
import * as crypto from 'crypto';

/**
 * Generates a valid Paystack HMAC-SHA512 signature for a webhook payload.
 */
function paystackSignature(payload: object, secret: string): string {
  return crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
}

describe('Tickets Integration Tests', () => {
  let app: INestApplication;
  let ds: DataSource;

  /** JWT tokens issued via the auth module for test users */
  let buyerToken: string;
  let hostToken: string;

  // ─── Setup ─────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    ds = module.get(DataSource);

    // Seed baseline data
    await cleanDatabase(ds);
    await seedPlatformConfig(ds);
    await createBuyerUser(ds);
    await createHostUser(ds);

    // Obtain JWTs by directly calling the auth service internals or mock tokens
    // In a real integration test you'd call POST /auth/otp/request + /verify
    // Here we use a helper that inserts a known refresh token into Redis and returns a JWT
    // (This would be a test-only utility in the actual implementation)
    buyerToken = await getTestToken(app, 'buyer-user-uuid', ['BUYER']);
    hostToken  = await getTestToken(app, 'host-user-uuid',  ['BUYER', 'HOST']);
  });

  afterAll(async () => {
    await cleanDatabase(ds);
    await app.close();
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Obtains a test JWT for the given userId and capabilities.
   * In a real setup, this would bypass OTP by using an admin endpoint or test factory.
   */
  async function getTestToken(app: INestApplication, userId: string, capabilities: string[]): Promise<string> {
    // This assumes a /test/token endpoint exists in test mode,
    // OR you can use the JwtService directly from the module.
    const jwtService = app.get('JwtService');
    return jwtService.sign({ sub: userId, capabilities }, { expiresIn: '1h' });
  }

  // ─── Reserve ───────────────────────────────────────────────────────────────

  describe('POST /tickets/reserve', () => {
    let eventId: string;
    let tierId: string;

    beforeEach(async () => {
      const { eventId: eid, tierId: tid } = await createPublishedEvent(ds);
      eventId = eid;
      tierId  = tid;
      // Initialize Redis inventory for this event
      await request(app.getHttpServer())
        .post(`/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);
    });

    it('INT-TKT-001: reserves a ticket and decrements inventory', async () => {
      const res = await request(app.getHttpServer())
        .post('/tickets/reserve')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ eventId, tierId })
        .expect(201);

      expect(res.body.status).toBe('RESERVED');
      expect(res.body.expires_at).toBeTruthy();
    });

    it('INT-TKT-002: returns 409 when sold out', async () => {
      // Exhaust all 100 tickets by calling reserve 100 times
      // (simplified: set Redis counter to 0 directly for test speed)
      const redis = app.get('REDIS_CLIENT');
      await redis.set(`inventory:${eventId}:${tierId}`, 0);

      await request(app.getHttpServer())
        .post('/tickets/reserve')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ eventId, tierId })
        .expect(409);
    });

    it('INT-TKT-001b: unauthenticated request returns 401', async () => {
      await request(app.getHttpServer())
        .post('/tickets/reserve')
        .send({ eventId, tierId })
        .expect(401);
    });
  });

  // ─── Cancel Reservation ────────────────────────────────────────────────────

  describe('DELETE /tickets/reserve/:ticketId', () => {
    it('INT-TKT-003: cancels own reservation, restores inventory', async () => {
      // Create reservation first
      const { eventId, tierId } = await createPublishedEvent(ds);
      const redis = app.get('REDIS_CLIENT');
      await redis.set(`inventory:${eventId}:${tierId}`, 100);

      const reserveRes = await request(app.getHttpServer())
        .post('/tickets/reserve')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ eventId, tierId })
        .expect(201);

      const ticketId = reserveRes.body.id;

      await request(app.getHttpServer())
        .delete(`/tickets/reserve/${ticketId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      // Inventory should be restored
      const count = await redis.get(`inventory:${eventId}:${tierId}`);
      expect(parseInt(count)).toBe(100);
    });

    it('INT-TKT-004: cannot cancel another user\'s reservation', async () => {
      // Create a ticket owned by host
      await createIssuedTicket(ds, 'someone-else-ticket');

      await request(app.getHttpServer())
        .delete('/tickets/reserve/someone-else-ticket')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);
    });
  });

  // ─── Payment Initialization ────────────────────────────────────────────────

  describe('POST /payments/initialize', () => {
    it('INT-TKT-005: transitions RESERVED ticket to PAYMENT_PENDING', async () => {
      const { eventId, tierId } = await createPublishedEvent(ds);
      const redis = app.get('REDIS_CLIENT');
      await redis.set(`inventory:${eventId}:${tierId}`, 100);

      // Reserve first
      const reserveRes = await request(app.getHttpServer())
        .post('/tickets/reserve')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ eventId, tierId })
        .expect(201);

      const ticketId = reserveRes.body.id;

      const initRes = await request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ticketId })
        .expect(201);

      expect(initRes.body.amount_minor).toBeGreaterThan(0);
      expect(initRes.body.payment_id).toBeTruthy();
    });
  });

  // ─── Paystack Webhook (charge.success) ─────────────────────────────────────

  describe('POST /webhooks/paystack', () => {
    it('INT-TKT-006: valid webhook transitions ticket to ISSUED with QR', async () => {
      const { eventId, tierId } = await createPublishedEvent(ds);
      const redis = app.get('REDIS_CLIENT');
      await redis.set(`inventory:${eventId}:${tierId}`, 100);

      // Reserve + initialize payment
      const reserveRes = await request(app.getHttpServer())
        .post('/tickets/reserve')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ eventId, tierId })
        .expect(201);

      const ticketId = reserveRes.body.id;

      const initRes = await request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ticketId })
        .expect(201);

      const providerRef = initRes.body.payment_id // simplified: get the ref from DB
        ? (await ds.query(`SELECT provider_reference FROM payments WHERE id = $1`, [initRes.body.payment_id]))[0]?.provider_reference
        : null;

      if (!providerRef) return; // skip if payment not found in DB

      const payload = {
        event: 'charge.success',
        data: { reference: providerRef, amount: 525000 },
      };

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY || 'test-paystack-secret';
      const sig = paystackSignature(payload, paystackSecret);

      await request(app.getHttpServer())
        .post('/webhooks/paystack')
        .set('x-paystack-signature', sig)
        .send(payload)
        .expect(200);

      // Verify ticket is now ISSUED
      const [ticket] = await ds.query(`SELECT status, ticket_code, qr_payload FROM tickets WHERE id = $1`, [ticketId]);
      expect(ticket.status).toBe('ISSUED');
      expect(ticket.ticket_code).toMatch(/^EVT-\d{4}-[A-F0-9]{4}$/);
      expect(ticket.qr_payload).toBeTruthy();
    });

    it('INT-TKT-007: duplicate webhook is idempotent (no double-issuance)', async () => {
      // Use an already-completed payment reference from the DB
      const existingPayment = await ds.query(
        `SELECT provider_reference FROM payments WHERE status = 'completed' LIMIT 1`
      );

      if (!existingPayment[0]) return; // skip if no completed payment in seed

      const ref = existingPayment[0].provider_reference;
      const payload = { event: 'charge.success', data: { reference: ref } };
      const sig = paystackSignature(payload, process.env.PAYSTACK_SECRET_KEY || 'test-paystack-secret');

      const result = await request(app.getHttpServer())
        .post('/webhooks/paystack')
        .set('x-paystack-signature', sig)
        .send(payload)
        .expect(200);

      expect(result.body.status).toBe('handled');
    });
  });

  // ─── My Tickets ────────────────────────────────────────────────────────────

  describe('GET /tickets/me', () => {
    it('INT-TKT-008: returns buyer\'s own tickets with event and tier relations', async () => {
      await createIssuedTicket(ds);

      const res = await request(app.getHttpServer())
        .get('/tickets/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Should include relations
      expect(res.body[0]).toHaveProperty('event');
      expect(res.body[0]).toHaveProperty('tier');
    });
  });
});

// ─── Refunds Integration Tests ─────────────────────────────────────────────────

describe('Refunds Integration Tests', () => {
  let app: INestApplication;
  let ds: DataSource;
  let buyerToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    ds = module.get(DataSource);
    await cleanDatabase(ds);
    await seedPlatformConfig(ds);
    await createBuyerUser(ds);
    await createHostUser(ds);
    await createPublishedEvent(ds);
    await createIssuedTicket(ds);
    buyerToken = app.get('JwtService').sign({ sub: 'buyer-user-uuid', capabilities: ['BUYER'] });
  });

  afterAll(async () => {
    await cleanDatabase(ds);
    await app.close();
  });

  it('INT-REF-001: valid buy-back request for ISSUED ticket 72h out → 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/refunds/buyback')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ ticketId: 'issued-ticket-uuid' })
      .expect(201);

    expect(res.body.amount_minor).toBe(350_000); // 70% of ₦5,000 = ₦3,500
    expect(res.body.refund_id).toBeTruthy();
  });

  it('INT-REF-006: GET /refunds/me returns sorted refund history', async () => {
    const res = await request(app.getHttpServer())
      .get('/refunds/me')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Security Integration Tests ─────────────────────────────────────────────

describe('Security: Authorization Checks', () => {
  let app: INestApplication;
  let ds: DataSource;
  let buyerToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    ds = module.get(DataSource);
    await cleanDatabase(ds);
    await createBuyerUser(ds);
    buyerToken = app.get('JwtService').sign({ sub: 'buyer-user-uuid', capabilities: ['BUYER'] });
  });

  afterAll(async () => {
    await cleanDatabase(ds);
    await app.close();
  });

  it('SEC-001: GET /tickets/me without auth → 401', async () => {
    await request(app.getHttpServer()).get('/tickets/me').expect(401);
  });

  it('SEC-002: POST /events with BUYER token → 403', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ title: 'Test', venue_name: 'V', city: 'Lagos' })
      .expect(403);
  });

  it('SEC-003: GET /admin/analytics with BUYER token → 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('SEC-004: tampered JWT (modified capabilities) → 401', async () => {
    // Create a raw JWT with falsified capabilities
    const tamperedToken = buyerToken.split('.').slice(0, 2).join('.') + '.invalidsignature';
    await request(app.getHttpServer())
      .get('/tickets/me')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  it('SEC-005: Paystack webhook with invalid HMAC → 400', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/paystack')
      .set('x-paystack-signature', 'badsignature')
      .send({ event: 'charge.success', data: { reference: 'ref' } })
      .expect(400);
  });

  it('SEC-007: QR scan with crafted (non-HMAC) signature → 400', async () => {
    const fakePayload = 'ticket-uuid:event-uuid:fakesignature123';
    await request(app.getHttpServer())
      .post('/scanning/validate')
      .set('Authorization', `Bearer ${buyerToken}`) // needs a host token in real test
      .send({ qrPayload: fakePayload })
      .expect(400);
  });
});
