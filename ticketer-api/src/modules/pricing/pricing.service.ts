import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import {
  BuyerFeeTier, BUYER_FEE_TIERS,
  HostCommissionTier, HOST_COMMISSION_TIERS,
} from '../../common/utils/pricing.util';

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly CONFIG_KEY = 'platform:config';

  constructor(
    @InjectRepository(PlatformConfig) private configRepo: Repository<PlatformConfig>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  async refreshCache() {
    const configs = await this.configRepo.find();
    if (!configs || configs.length === 0) return;
    const configMap: Record<string, any> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    await this.redis.set(this.CONFIG_KEY, JSON.stringify(configMap), 'EX', 300);
  }

  async getConfigMap(): Promise<any> {
    const cached = await this.redis.get(this.CONFIG_KEY);
    if (cached) return JSON.parse(cached);
    await this.refreshCache();
    const refreshed = await this.redis.get(this.CONFIG_KEY);
    return refreshed ? JSON.parse(refreshed) : {};
  }

  /**
   * Buyer service fee — tiered by ticket price with per-tier caps.
   * Reads `buyer_fee_tiers` JSON from platform_config. Falls back to hardcoded defaults.
   */
  async calculateBuyerServiceFee(ticketPriceMinor: number): Promise<number> {
    if (ticketPriceMinor === 0) return 0;

    const config = await this.getConfigMap();
    const tiers: BuyerFeeTier[] = config.buyer_fee_tiers ?? BUYER_FEE_TIERS;

    const tier = tiers.find(
      t => ticketPriceMinor >= t.minPrice && ticketPriceMinor <= (t.maxPrice === null ? Infinity : t.maxPrice),
    );
    if (!tier) return 0; // Below minimum ticket price

    const rawFee = Math.round(ticketPriceMinor * tier.rate);
    const cap = tier.capAmount === null ? Infinity : tier.capAmount;
    return Math.min(rawFee, cap);
  }

  /**
   * Host commission — tiered by total event ticket capacity.
   * Reads `host_commission_tiers` JSON from platform_config. Falls back to hardcoded defaults.
   */
  async calculateHostCommission(
    totalTicketCapacity: number,
    grossRevenueMinor: number,
  ): Promise<{ rate: number; commission: number; tier: string }> {
    const config = await this.getConfigMap();
    const tiers: HostCommissionTier[] = config.host_commission_tiers ?? HOST_COMMISSION_TIERS;

    const tier = tiers.find(
      t => totalTicketCapacity >= t.minTickets && totalTicketCapacity <= (t.maxTickets === null ? Infinity : t.maxTickets),
    );
    if (!tier) return { rate: 0, commission: 0, tier: 'below_minimum' };

    return {
      rate: tier.rate,
      commission: Math.round(grossRevenueMinor * tier.rate),
      tier: tier.maxTickets <= 500 ? 'small' : tier.maxTickets <= 5000 ? 'medium' : 'grand',
    };
  }
}
