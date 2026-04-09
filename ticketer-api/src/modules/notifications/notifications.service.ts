import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notification-dispatch') private dispatchQueue: Queue) {}

  async send(userId: string, type: string, payload: any) {
    await this.dispatchQueue.add('dispatch-notification', { userId, type, payload });
  }
}
