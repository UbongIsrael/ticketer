import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initializePayment(
    @CurrentUser() user: any,
    @Body('ticketId') ticketId: string,
  ) {
    return this.paymentsService.initializePayment(user.id, ticketId);
  }
}
