import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('webhooks')
export class PaymentsWebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack')
  async handlePaystack(@Body() payload: any, @Headers('x-paystack-signature') signature: string) {
    return this.paymentsService.processWebhook(payload, signature);
  }
}
