import { Controller, Post, Delete, Param, Body, UseGuards, Get } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  async reserveTicket(
    @CurrentUser() user: any,
    @Body() body: { event_id: string; tier_id: string; quantity?: number }
  ) {
    const qty = body.quantity || 1;
    return this.ticketsService.reserve(user.id, body.event_id, body.tier_id, qty);
  }

  @Delete('reserve/:ticketId')
  @UseGuards(JwtAuthGuard)
  async cancelReservation(
    @CurrentUser() user: any,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.cancelReservation(ticketId, user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyTickets(@CurrentUser() user: any) {
    return this.ticketsService.getMyTickets(user.id);
  }

  @Get('me/:ticketId')
  @UseGuards(JwtAuthGuard)
  async getTicketById(
    @CurrentUser() user: any,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.getTicketById(ticketId, user.id);
  }
}
