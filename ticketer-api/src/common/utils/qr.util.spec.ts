import * as crypto from 'crypto';
import { generateQrPayload, verifyQrPayload } from './qr.util';

const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_EVENT_ID  = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SECRET          = 'test-qr-secret-key';
const WRONG_SECRET    = 'wrong-secret-key';

describe('generateQrPayload', () => {
  it('QR-001: returns string in ticketId:eventId:hmac format', () => {
    const payload = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, SECRET);
    const parts = payload.split(':');
    expect(parts.length).toBeGreaterThanOrEqual(3);
    // First two parts are the IDs
    expect(payload.startsWith(`${VALID_TICKET_ID}:${VALID_EVENT_ID}:`)).toBe(true);
  });

  it('produces deterministic HMAC for same inputs', () => {
    const p1 = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, SECRET);
    const p2 = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, SECRET);
    expect(p1).toBe(p2);
  });

  it('produces different payload for different secret', () => {
    const p1 = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, SECRET);
    const p2 = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, WRONG_SECRET);
    expect(p1).not.toBe(p2);
  });
});

describe('verifyQrPayload', () => {
  let validPayload: string;

  beforeEach(() => {
    validPayload = generateQrPayload(VALID_TICKET_ID, VALID_EVENT_ID, SECRET);
  });

  it('QR-002: valid payload + correct secret → isValid: true with correct IDs', () => {
    const result = verifyQrPayload(validPayload, SECRET);
    expect(result.isValid).toBe(true);
    expect(result.ticketId).toBe(VALID_TICKET_ID);
    expect(result.eventId).toBe(VALID_EVENT_ID);
  });

  it('QR-003: valid payload + wrong secret → isValid: false', () => {
    const result = verifyQrPayload(validPayload, WRONG_SECRET);
    expect(result.isValid).toBe(false);
  });

  it('QR-004: tampered payload (swapped IDs) → isValid: false', () => {
    // Swap ticket and event IDs in the payload
    const tampered = `${VALID_EVENT_ID}:${VALID_TICKET_ID}:${validPayload.split(':').slice(2).join(':')}`;
    const result = verifyQrPayload(tampered, SECRET);
    expect(result.isValid).toBe(false);
  });

  it('QR-005: truncated payload (missing HMAC part) → isValid: false', () => {
    const truncated = `${VALID_TICKET_ID}:${VALID_EVENT_ID}`;
    const result = verifyQrPayload(truncated, SECRET);
    expect(result.isValid).toBe(false);
  });

  it('QR-006: completely empty string → isValid: false, no throw', () => {
    expect(() => verifyQrPayload('', SECRET)).not.toThrow();
    const result = verifyQrPayload('', SECRET);
    expect(result.isValid).toBe(false);
  });

  it('QR-006b: random garbage string → isValid: false', () => {
    const result = verifyQrPayload('not-a-real-payload', SECRET);
    expect(result.isValid).toBe(false);
  });

  it('QR-006c: HMAC part is correct length but wrong value → isValid: false', () => {
    const parts = validPayload.split(':');
    parts[parts.length - 1] = 'a'.repeat(64); // 64 hex chars, wrong value
    const result = verifyQrPayload(parts.join(':'), SECRET);
    expect(result.isValid).toBe(false);
  });
});
