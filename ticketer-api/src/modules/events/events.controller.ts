import { Controller, Post, Get, Patch, Body, Param, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequiresCapability } from '../../common/decorators/requires-capability.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EventGuardrailsInterceptor } from './interceptors/event-guardrails.interceptor';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async createEvent(@CurrentUser() user: any, @Body() body: any) {
    return this.eventsService.create(user.id, body);
  }

  @Post(':id/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async createTiers(@Param('id') eventId: string, @Body() body: { tiers: any[] }) {
    return this.eventsService.createTiers(eventId, body.tiers);
  }

  @Get()
  async searchEvents(
    @Query('query') query: string,
    @Query('city') city: string,
    @Query('event_type') eventType: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.eventsService.search(query, city, eventType, parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(EventGuardrailsInterceptor)
  @RequiresCapability('HOST')
  async updateEvent(@Param('id') id: string, @Body() body: any) {
    return this.eventsService.updateEvent(id, body);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async publishEvent(@Param('id') id: string) {
    return this.eventsService.publishEvent(id);
  }

  @Post(':id/payouts/request-partial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async requestPartialPayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.requestPartialPayout(id, user.id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async cancelEvent(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.cancelEvent(id, user);
  }

  @Get('slug/:slug')
  async getEventBySlug(@Param('slug') slug: string) {
    return this.eventsService.findOneBySlug(slug);
  }

  @Get('host/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequiresCapability('HOST')
  async getMyEvents(@CurrentUser() user: any) {
    return this.eventsService.getMyEvents(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getAttendedEvents(@CurrentUser() user: any) {
    return this.eventsService.getAttendedEvents(user.id);
  }
}
