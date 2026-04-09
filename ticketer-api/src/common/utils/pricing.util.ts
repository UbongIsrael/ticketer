export interface BuyerFeeTier {
  minPrice: number;   // kobo
  maxPrice: number;   // kobo (Infinity for last tier)
  rate: number;       // 0.05 = 5%
  capAmount: number;  // kobo (Infinity = no cap)
}

// Default tiers (loaded from platform_config table)
export const BUYER_FEE_TIERS: BuyerFeeTier[] = [
  { minPrice: 200_000, maxPrice: 999_999,     rate: 0.05, capAmount: Infinity },    // ₦2k-₦9,999: 5% uncapped
  { minPrice: 1_000_000, maxPrice: 9_999_999, rate: 0.05, capAmount: 50_000 },      // ₦10k-₦99,999: 5% cap ₦500
  { minPrice: 10_000_000, maxPrice: 99_999_999, rate: 0.05, capAmount: 100_000 },   // ₦100k-₦999,999: 5% cap ₦1,000
  { minPrice: 100_000_000, maxPrice: Infinity, rate: 0.05, capAmount: 500_000 },    // ≥₦1M: 5% cap ₦5,000
];

export function calculateBuyerServiceFee(ticketPriceMinor: number, tiers: BuyerFeeTier[] = BUYER_FEE_TIERS): number {
  const tier = tiers.find(
    t => ticketPriceMinor >= t.minPrice && ticketPriceMinor <= t.maxPrice
  );
  if (!tier) return 0; // Below minimum ticket price
  
  const rawFee = Math.round(ticketPriceMinor * tier.rate);
  return Math.min(rawFee, tier.capAmount);
}

export interface HostCommissionTier {
  minTickets: number;
  maxTickets: number;
  rate: number; // 0.10 = 10%
}

export const HOST_COMMISSION_TIERS: HostCommissionTier[] = [
  { minTickets: 50,   maxTickets: 500,      rate: 0.10 },  // 10%
  { minTickets: 501,  maxTickets: 5_000,    rate: 0.15 },  // 15%
  { minTickets: 5_001, maxTickets: Infinity, rate: 0.30 },  // 30%
];

export function calculateHostCommission(
  totalTicketCapacity: number,
  grossRevenue: number,
  tiers: HostCommissionTier[] = HOST_COMMISSION_TIERS
): { rate: number; commission: number; tier: string } {
  const tier = tiers.find(
    t => totalTicketCapacity >= t.minTickets && totalTicketCapacity <= t.maxTickets
  );
  if (!tier) return { rate: 0, commission: 0, tier: 'below_minimum' };
  
  return {
    rate: tier.rate,
    commission: Math.round(grossRevenue * tier.rate),
    tier: tier.maxTickets <= 500 ? 'small' : tier.maxTickets <= 5000 ? 'medium' : 'grand',
  };
}
