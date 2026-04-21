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
    @Body('ticket_ids') ticketIds: string[],
  ) {
    return this.paymentsService.initializePayment(user.id, ticketIds);
  }
}
