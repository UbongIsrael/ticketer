import {
  calculateBuyerServiceFee,
  calculateHostCommission,
  BUYER_FEE_TIERS,
  HOST_COMMISSION_TIERS,
} from './pricing.util';

describe('calculateBuyerServiceFee', () => {
  /** Tier 1: ₦2,000 – ₦9,999 → 5%, no cap */
  describe('Tier 1 (₦2,000 – ₦9,999) — 5% uncapped', () => {
    it('PRC-001: minimum price ₦2,000 → ₦100 fee', () => {
      expect(calculateBuyerServiceFee(200_000)).toBe(10_000);
    });

    it('PRC-002: ₦5,000 → ₦250 fee', () => {
      expect(calculateBuyerServiceFee(500_000)).toBe(25_000);
    });

    it('PRC-003: ₦9,999.99 (999,999 kobo) → 50,000 kobo fee (rounds up)', () => {
      // 999,999 * 0.05 = 49,999.95 → Math.round → 50,000 (no cap at this tier)
      expect(calculateBuyerServiceFee(999_999)).toBe(50_000);
    });
  });

  /** Tier 2: ₦10,000 – ₦99,999 → 5% capped at ₦500 */
  describe('Tier 2 (₦10,000 – ₦99,999) — 5% capped at ₦500', () => {
    it('PRC-004: ₦10,000 → ₦500 (cap)', () => {
      expect(calculateBuyerServiceFee(1_000_000)).toBe(50_000);
    });

    it('PRC-005: ₦20,000 — raw would be ₦1,000 but cap applies → ₦500', () => {
      expect(calculateBuyerServiceFee(2_000_000)).toBe(50_000);
    });

    it('PRC-006: ₦99,999.99 — cap still applies → ₦500', () => {
      expect(calculateBuyerServiceFee(9_999_999)).toBe(50_000);
    });
  });

  /** Tier 3: ₦100,000 – ₦999,999 → 5% capped at ₦1,000 */
  describe('Tier 3 (₦100,000 – ₦999,999) — 5% capped at ₦1,000', () => {
    it('PRC-007: ₦100,000 → ₦1,000 (cap)', () => {
      expect(calculateBuyerServiceFee(10_000_000)).toBe(100_000);
    });

    it('PRC-008: ₦200,000 — raw would be ₦10,000 but cap applies → ₦1,000', () => {
      expect(calculateBuyerServiceFee(20_000_000)).toBe(100_000);
    });
  });

  /** Tier 4: ≥₦1,000,000 → 5% capped at ₦5,000 */
  describe('Tier 4 (≥₦1,000,000) — 5% capped at ₦5,000', () => {
    it('PRC-009: ₦1,000,000 → ₦5,000 (cap)', () => {
      expect(calculateBuyerServiceFee(100_000_000)).toBe(500_000);
    });

    it('PRC-010: ₦5,000,000 — raw would be ₦250,000 but cap applies → ₦5,000', () => {
      expect(calculateBuyerServiceFee(500_000_000)).toBe(500_000);
    });
  });

  /** Edge cases */
  describe('Edge cases', () => {
    it('PRC-011: below minimum (₦1,000) → returns 0, no tier match', () => {
      expect(calculateBuyerServiceFee(100_000)).toBe(0);
    });

    it('PRC-012: zero price → returns 0', () => {
      expect(calculateBuyerServiceFee(0)).toBe(0);
    });

    it('returns integer (no floating point issues)', () => {
      const result = calculateBuyerServiceFee(500_000);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});

describe('calculateHostCommission', () => {
  describe('Below minimum capacity (<50 tickets)', () => {
    it('PRC-020: 49 tickets → 0% commission, below_minimum tier', () => {
      const result = calculateHostCommission(49, 10_000_000);
      expect(result.rate).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.tier).toBe('below_minimum');
    });
  });

  describe('Small events (50–500 tickets) — 10% commission', () => {
    it('PRC-021: 50 tickets (boundary) → 10%', () => {
      const result = calculateHostCommission(50, 10_000_000);
      expect(result.rate).toBe(0.10);
      expect(result.commission).toBe(1_000_000);
      expect(result.tier).toBe('small');
    });

    it('PRC-022: 250 tickets → 10%', () => {
      const result = calculateHostCommission(250, 25_000_000);
      expect(result.commission).toBe(2_500_000);
      expect(result.tier).toBe('small');
    });

    it('PRC-023: 500 tickets (ceiling) → 10%', () => {
      const result = calculateHostCommission(500, 50_000_000);
      expect(result.rate).toBe(0.10);
      expect(result.commission).toBe(5_000_000);
      expect(result.tier).toBe('small');
    });
  });

  describe('Medium events (501–5,000 tickets) — 15% commission', () => {
    it('PRC-024: 501 tickets (boundary) → 15%', () => {
      const result = calculateHostCommission(501, 60_000_000);
      expect(result.rate).toBe(0.15);
      expect(result.commission).toBe(9_000_000);
      expect(result.tier).toBe('medium');
    });

    it('PRC-025: 2,500 tickets → 15%', () => {
      const result = calculateHostCommission(2_500, 100_000_000);
      expect(result.commission).toBe(15_000_000);
    });

    it('PRC-026: 5,000 tickets (ceiling) → 15%', () => {
      const result = calculateHostCommission(5_000, 200_000_000);
      expect(result.rate).toBe(0.15);
      expect(result.tier).toBe('medium');
    });
  });

  describe('Grand events (>5,000 tickets) — 30% commission', () => {
    it('PRC-027: 5,001 tickets (boundary) → 30%', () => {
      const result = calculateHostCommission(5_001, 300_000_000);
      expect(result.rate).toBe(0.30);
      expect(result.commission).toBe(90_000_000);
      expect(result.tier).toBe('grand');
    });

    it('PRC-028: 50,000 tickets → 30%', () => {
      const result = calculateHostCommission(50_000, 1_000_000_000);
      expect(result.commission).toBe(300_000_000);
      expect(result.tier).toBe('grand');
    });
  });

  describe('Result is always integer (kobo-safe)', () => {
    it('commission is an integer', () => {
      const result = calculateHostCommission(100, 999_999);
      expect(Number.isInteger(result.commission)).toBe(true);
    });
  });
});
