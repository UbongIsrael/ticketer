import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanningService } from './scanning.service';
import { ScanningController } from './scanning.controller';
import { ScanningGateway } from './scanning.gateway';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    forwardRef(() => TicketsModule),
    RedisModule
  ],
  controllers: [ScanningController],
  providers: [ScanningService, ScanningGateway],
  exports: [ScanningService]
})
export class ScanningModule {}
