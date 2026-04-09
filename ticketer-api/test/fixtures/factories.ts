/**
 * Test fixtures and factories for integration tests.
 * These create consistent seed data for all integration test suites.
 */
import { DataSource } from 'typeorm';

// ─── User Fixtures ────────────────────────────────────────────────────────────

export async function createAdminUser(ds: DataSource) {
  return ds.query(`
    INSERT INTO users (id, email, name, capabilities, auth_provider, created_at, updated_at)
    VALUES (
      'admin-user-uuid',
      'admin@ticketer.test',
      'Admin User',
      ARRAY['BUYER','HOST','ADMIN'],
      'email',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING *
  `);
}

export async function createHostUser(ds: DataSource) {
  return ds.query(`
    INSERT INTO users (id, email, name, capabilities, auth_provider, created_at, updated_at)
    VALUES (
      'host-user-uuid',
      'host@ticketer.test',
      'Host User',
      ARRAY['BUYER','HOST'],
      'email',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING *
  `);
}

export async function createBuyerUser(ds: DataSource) {
  return ds.query(`
    INSERT INTO users (id, email, name, capabilities, auth_provider, created_at, updated_at)
    VALUES (
      'buyer-user-uuid',
      'buyer@ticketer.test',
      'Buyer User',
      ARRAY['BUYER'],
      'email',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING *
  `);
}

// ─── Event Fixtures ───────────────────────────────────────────────────────────

/**
 * Create a published event with 1 ticket tier (100 tickets, small event → 10% commission).
 * starts_at is 72h from now so buy-back is open.
 */
export async function createPublishedEvent(ds: DataSource) {
  const eventId = 'published-event-uuid';
  const tierId  = 'standard-tier-uuid';

  await ds.query(`
    INSERT INTO events (
      id, host_id, title, slug, venue_name, venue_address,
      city, state, event_type, starts_at, ends_at, status, currency, created_at, updated_at
    ) VALUES (
      '${eventId}',
      'host-user-uuid',
      'Test Concert',
      'test-concert-${Date.now()}',
      'Eko Hotel',
      'Victoria Island, Lagos',
      'Lagos', 'Lagos', 'Afrobeats',
      NOW() + INTERVAL '72 hours',
      NOW() + INTERVAL '75 hours',
      'published', 'NGN', NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  await ds.query(`
    INSERT INTO ticket_tiers (
      id, event_id, name, price_minor, total_quantity, sold_count,
      sort_order, created_at, updated_at
    ) VALUES (
      '${tierId}',
      '${eventId}',
      'Standard GA',
      500000,
      100,
      0,
      1, NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  return { eventId, tierId };
}

/**
 * Create an event that starts in 20h (inside the 48h buy-back window).
 */
export async function createSoonEvent(ds: DataSource) {
  const eventId = 'soon-event-uuid';
  const tierId  = 'soon-tier-uuid';

  await ds.query(`
    INSERT INTO events (
      id, host_id, title, slug, venue_name, venue_address,
      city, state, event_type, starts_at, ends_at, status, currency, created_at, updated_at
    ) VALUES (
      '${eventId}', 'host-user-uuid', 'Soon Event', 'soon-event-${Date.now()}',
      'Transcorp Hilton', 'Abuja', 'Abuja', 'FCT', 'concert',
      NOW() + INTERVAL '20 hours', NOW() + INTERVAL '23 hours',
      'published', 'NGN', NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  await ds.query(`
    INSERT INTO ticket_tiers (id, event_id, name, price_minor, total_quantity, sold_count, sort_order, created_at, updated_at)
    VALUES ('${tierId}', '${eventId}', 'Regular', 200000, 50, 0, 1, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  return { eventId, tierId };
}

/**
 * Create an ISSUED ticket owned by buyerUser for the published event.
 */
export async function createIssuedTicket(ds: DataSource, ticketId = 'issued-ticket-uuid') {
  await ds.query(`
    INSERT INTO tickets (
      id, event_id, tier_id, owner_id,
      ticket_code, status, qr_payload,
      issued_at, paid_at, reserved_at, created_at, updated_at
    ) VALUES (
      '${ticketId}', 'published-event-uuid', 'standard-tier-uuid', 'buyer-user-uuid',
      'EVT-2026-AB3F', 'ISSUED',
      '${ticketId}:published-event-uuid:mockhmacsignature',
      NOW(), NOW(), NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  // Also create a corresponding completed payment
  await ds.query(`
    INSERT INTO payments (
      id, user_id, ticket_id, ticket_price_minor, buyer_service_fee_minor,
      total_charged_minor, currency, provider, provider_reference, status, created_at
    ) VALUES (
      'payment-for-${ticketId}', 'buyer-user-uuid', '${ticketId}',
      500000, 25000, 525000, 'NGN', 'paystack',
      'paystack-ref-${ticketId}', 'completed', NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  return ticketId;
}

// ─── Platform Config Fixtures ─────────────────────────────────────────────────

export async function seedPlatformConfig(ds: DataSource) {
  await ds.query(`
    INSERT INTO platform_config (key, value, description, updated_at)
    VALUES
      ('buyback_window_hours', '48',   'Hours before event that buy-back closes', NOW()),
      ('buyer_fee_tiers',      '[]',   'Buyer service fee tier config',            NOW()),
      ('host_commission_tiers','[]',   'Host commission tier config',              NOW())
    ON CONFLICT (key) DO NOTHING
  `);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function cleanDatabase(ds: DataSource) {
  await ds.query('TRUNCATE TABLE notification_logs, refunds, payment_events, payments, tickets, ticket_tiers, approval_requests, host_settlements, events, kyc_records, platform_config, users CASCADE');
}
