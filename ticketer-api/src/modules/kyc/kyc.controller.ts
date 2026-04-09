import { Controller, Post, UseGuards, Get, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiateKyc(@CurrentUser() user: any) {
    return this.kycService.initiate(user.id);
  }

  @Post('webhooks/smile-identity')
  async handleWebhook(@Body() payload: any) {
    return this.kycService.processWebhook(payload);
  }
}
