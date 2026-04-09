import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post('buyback')
  @UseGuards(JwtAuthGuard)
  async initiateBuyback(
    @CurrentUser() user: any,
    @Body('ticketId') ticketId: string,
  ) {
    return this.refundsService.requestBuyback(user.id, ticketId);
  }

  @Post('mock-webhook/success')
  async mockSuccess(@Body('provider_reference') ref: string) {
    return this.refundsService.processMockTransferSuccess(ref);
  }

  @Post('mock-webhook/failed')
  async mockFailed(@Body('provider_reference') ref: string) {
    return this.refundsService.processMockTransferFailed(ref);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyRefunds(@CurrentUser() user: any) {
    return this.refundsService.getMyRefunds(user.id);
  }
}
