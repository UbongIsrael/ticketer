import { Injectable, Inject, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { OtpDeliveryService } from './otp-delivery.service';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly MAX_ATTEMPTS_PER_HOUR = 500;
  private readonly OTP_TTL_SECONDS = 300;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly deliveryService: OtpDeliveryService,
  ) {}

  async generateAndSend(identifier: string): Promise<void> {
    const rateKey = `otp_rate:${identifier}`;
    const attempts = await this.redis.incr(rateKey);
    if (attempts === 1) {
      await this.redis.expire(rateKey, 3600);
    }

    if (attempts > this.MAX_ATTEMPTS_PER_HOUR) {
      throw new HttpException('Too many OTP requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const tokenKey = `otp:${identifier}`;
    await this.redis.set(tokenKey, code, 'EX', this.OTP_TTL_SECONDS);

    const delivered = await this.deliveryService.sendOtp(identifier, code);
    if (!delivered) {
      throw new BadRequestException('Failed to deliver OTP message');
    }
  }

  async verify(identifier: string, code: string): Promise<boolean> {
    const tokenKey = `otp:${identifier}`;
    const storedCode = await this.redis.get(tokenKey);
    
    if (!storedCode) {
      return false;
    }

    if (crypto.timingSafeEqual(Buffer.from(storedCode), Buffer.from(code))) {
      await this.redis.del(tokenKey);
      return true;
    }
    
    return false;
  }
}
