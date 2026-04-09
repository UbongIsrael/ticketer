import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationRouterProcessor } from './notification-router.processor';
import { NotificationLog } from './entities/notification-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog]),
    BullModule.registerQueue({ name: 'notification-dispatch' })
  ],
  providers: [NotificationsService, NotificationRouterProcessor],
  exports: [NotificationsService]
})
export class NotificationsModule {}
