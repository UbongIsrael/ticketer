import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OtpService } from './otp/otp.service';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private otpService: OtpService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async requestOtp(identifier: string) {
    if (!identifier) throw new UnauthorizedException('Identifier required');
    await this.otpService.generateAndSend(identifier);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(identifier: string, code: string) {
    const isValid = await this.otpService.verify(identifier, code);
    if (!isValid) throw new UnauthorizedException('Invalid or expired OTP');

    let user = await this.userRepo.findOne({ 
      where: [{ email: identifier }, { phone: identifier }] 
    });

    if (!user) {
      user = this.userRepo.create({
        [identifier.includes('@') ? 'email' : 'phone']: identifier,
        auth_provider: 'email'
      });
      user = await this.userRepo.save(user);
    }
    return this.generateTokens(user);
  }

  async validateOAuthUser(profile: any) {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });
    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        auth_provider: profile.provider,
      });
      user = await this.userRepo.save(user);
    }
    return user;
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, capabilities: user.capabilities };
    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = uuidv4();
    await this.redis.set(`rt:${refreshToken}`, user.id, 'EX', 7 * 24 * 60 * 60);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    const userId = await this.redis.get(`rt:${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    // Rotate token by deleting old token
    await this.redis.del(`rt:${refreshToken}`);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    
    return this.generateTokens(user);
  }
}
