import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRecord } from './entities/kyc-record.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycRecord) private kycRepository: Repository<KycRecord>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async initiate(userId: string) {
    const reference = `TICKETER-KYC-${Date.now()}`;
    const record = this.kycRepository.create({
      user_id: userId,
      provider: 'smile_identity',
      provider_reference: reference,
      status: 'pending',
      id_type: 'NIN',
    });
    await this.kycRepository.save(record);

    return {
      success: true,
      reference,
      mock_verification_url: `http://localhost:3000/mock-smile-identity?ref=${reference}`,
    };
  }

  async processWebhook(payload: any) {
    const { reference, status, verification_data } = payload;
    this.logger.log(`Received KYC webhook for ${reference} with status: ${status}`);

    const record = await this.kycRepository.findOne({ where: { provider_reference: reference } });
    if (!record) {
      throw new NotFoundException('KYC record not found');
    }

    record.status = status;
    record.verification_data = verification_data;

    if (status === 'verified') {
      record.verified_at = new Date();
      
      const user = await this.userRepository.findOne({ where: { id: record.user_id } });
      if (user && !user.capabilities.includes('HOST')) {
        user.capabilities.push('HOST');
        await this.userRepository.save(user);
        this.logger.log(`Elevated user ${user.id} to HOST capability`);
      }
    }

    await this.kycRepository.save(record);
    return { received: true };
  }
}
