import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class InventoryService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async reserveTicket(eventId: string, tierId: string, quantity: number = 1): Promise<void> {
    const key = `inventory:${eventId}:${tierId}`;
    
    const remaining = await this.redis.decrby(key, quantity);
    
    if (remaining < 0) {
      await this.redis.incrby(key, quantity);
      throw new BadRequestException('Ticket tier is sold out');
    }
  }

  async releaseTicket(eventId: string, tierId: string, quantity: number = 1): Promise<void> {
    const key = `inventory:${eventId}:${tierId}`;
    await this.redis.incrby(key, quantity);
  }

  async setInitialInventory(eventId: string, tierId: string, quantity: number): Promise<void> {
    const key = `inventory:${eventId}:${tierId}`;
    await this.redis.set(key, quantity);
  }

  async addValidTicket(eventId: string, ticketId: string): Promise<void> {
    await this.redis.sadd(`valid_tickets:${eventId}`, ticketId);
  }
}
