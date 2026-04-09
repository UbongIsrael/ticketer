import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PlatformConfig } from '../admin/entities/platform-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformConfig])],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
