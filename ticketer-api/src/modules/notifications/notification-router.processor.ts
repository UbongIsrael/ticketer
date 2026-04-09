import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './entities/notification-log.entity';

const CHANNEL_MATRIX: Record<string, string[]> = {
  'ticket_issued': ['whatsapp', 'email', 'in_app'],
  'event_reminder_24h': ['whatsapp', 'email', 'in_app'],
  'event_reminder_2h': ['whatsapp', 'in_app'],
  'event_cancelled': ['whatsapp', 'sms', 'email', 'in_app'],
  'buyback_settled': ['whatsapp', 'email', 'in_app'],
  'buyback_failed': ['whatsapp', 'sms', 'email', 'in_app']
};

@Processor('notification-dispatch')
export class NotificationRouterProcessor extends WorkerHost {
  constructor(
    @InjectRepository(NotificationLog) private logRepo: Repository<NotificationLog>,
  ) { super(); }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, payload } = job.data;
    const channels = CHANNEL_MATRIX[type] || ['in_app'];

    for (const channel of channels) {
      console.log(`[Notification MOCK]: Sending ${type} to ${userId} via ${channel.toUpperCase()}`);
      
      const log = this.logRepo.create({
        user_id: userId,
        type,
        channel,
        payload,
        status: 'delivered'
      });
      await this.logRepo.save(log);
    }
  }
}
