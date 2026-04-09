import { AppDataSource } from '../data-source';
import { PlatformConfig } from '../../modules/admin/entities/platform-config.entity';
import { BUYER_FEE_TIERS, HOST_COMMISSION_TIERS } from '../../common/utils/pricing.util';

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(PlatformConfig);
  
  await repo.save([
    { key: 'buyback_window_hours', value: 48, description: 'Buy-back refund cut-off window' },
    { key: 'buyer_fee_tiers', value: BUYER_FEE_TIERS, description: 'Buyer service fee calculation tiers' },
    { key: 'host_commission_tiers', value: HOST_COMMISSION_TIERS, description: 'Host commission tiers' },
    { key: 'min_ticket_price_minor', value: 200000, description: 'Minimum ticket price (₦2,000)' }
  ]);
  
  console.log('Seed completed successfully!');
  await AppDataSource.destroy();
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
