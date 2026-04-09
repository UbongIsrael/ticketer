import { Injectable, NotFoundException, OnApplicationBootstrap, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Event } from './entities/event.entity';
import { TicketTier } from './entities/ticket-tier.entity';

import { PricingService } from '../pricing/pricing.service';
import { HostSettlement } from './entities/host-settlement.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PlatformConfig } from '../admin/entities/platform-config.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { InventoryService } from '../tickets/inventory.service';
import { RefundsService } from '../refunds/refunds.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(TicketTier) private tierRepo: Repository<TicketTier>,
    @InjectRepository(HostSettlement) private settlementRepo: Repository<HostSettlement>,
    @InjectRepository(ApprovalRequest) private approvalRepo: Repository<ApprovalRequest>,
    @InjectRepository(PlatformConfig) private configRepo: Repository<PlatformConfig>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @Inject(forwardRef(() => InventoryService)) private inventoryService: InventoryService,
    @Inject(forwardRef(() => RefundsService)) private refundsService: RefundsService,
    private pricingService: PricingService,
    private notificationsService: NotificationsService,
  ) {}

  async onApplicationBootstrap() {
    await this.eventRepo.query(`
      CREATE OR REPLACE FUNCTION events_search_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.description,'') || ' ' || COALESCE(NEW.venue_name,'') || ' ' || COALESCE(NEW.city,''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await this.eventRepo.query(`DROP TRIGGER IF EXISTS events_search_trigger ON events;`);
    await this.eventRepo.query(`
      CREATE TRIGGER events_search_trigger BEFORE INSERT OR UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION events_search_update();
    `);
  }

  async create(hostId: string, eventData: any) {
    const slug = `${eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const event = this.eventRepo.create({
      ...eventData,
      host_id: hostId,
      slug,
      status: 'draft', // Host must explicitly publish later
    });
    return this.eventRepo.save(event);
  }

  async createTiers(eventId: string, tiers: any[]) {
    const event = await this.eventRepo.findOne({ where: { id: eventId }});
    if (!event) throw new NotFoundException('Event not found');

    const createdTiers = this.tierRepo.create(
      tiers.map(t => ({ ...t, event_id: eventId }))
    );
    return this.tierRepo.save(createdTiers);
  }

  async search(query?: string, city?: string, eventType?: string, page = 1, limit = 20) {
    let qb = this.eventRepo.createQueryBuilder('event');
    
    qb.where("UPPER(event.status) = 'PUBLISHED'");
    
    if (city) {
      qb.andWhere('event.city ILIKE :city', { city: `%${city}%` });
    }

    if (eventType) {
      qb.andWhere('event.event_type ILIKE :eventType', { eventType: `%${eventType}%` });
    }
    
    if (query) {
      qb.andWhere(`event.search_vector @@ plainto_tsquery('english', :query)`, { query });
    }

    qb.orderBy('event.starts_at', 'ASC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.eventRepo.findOne({ where: { id }});
    if (!event) throw new NotFoundException();
    const tiers = await this.tierRepo.find({ where: { event_id: id }});
    return { ...event, tiers };
  }

  async updateEvent(id: string, updates: any) {
    await this.eventRepo.update(id, updates);
    return this.findOne(id);
  }

  async publishEvent(id: string) {
    const event = await this.eventRepo.findOne({ where: { id }});
    if (!event) throw new NotFoundException();
    
    event.status = 'PUBLISHED';
    await this.eventRepo.save(event);

    const tiers = await this.tierRepo.find({ where: { event_id: id }});
    for (const tier of tiers) {
       await this.inventoryService.setInitialInventory(event.id, tier.id, tier.total_quantity);
    }

    const hostSettlement = this.settlementRepo.create({
      event_id: event.id,
      host_id: event.host_id,
      status: 'pending'
    });
    await this.settlementRepo.save(hostSettlement);

    return event;
  }

  async cancelEvent(id: string, user: any) {
    const event = await this.eventRepo.findOne({ where: { id }});
    if (!event) throw new NotFoundException();

    const msUntilEvent = event.starts_at.getTime() - Date.now();
    if (msUntilEvent < 24 * 60 * 60 * 1000) {
        const approval = this.approvalRepo.create({
            event_id: event.id,
            requester_id: user.id,
            change_type: 'cancellation',
            status: 'pending'
        });
        await this.approvalRepo.save(approval);
        return { message: 'Cancellation requires admin approval since the event is less than 24h away.', approval_id: approval.id, status: 202 };
    }

    event.status = 'cancelled';
    await this.eventRepo.save(event);
    
    await this.refundsService.massRefundForCancellation(event.id);

    // Notify all ticket holders about cancellation
    const tickets = await this.ticketRepo.find({ where: { event_id: event.id } });
    const notifiedUsers = new Set<string>();
    for (const t of tickets) {
      if (t.owner_id && !notifiedUsers.has(t.owner_id)) {
        notifiedUsers.add(t.owner_id);
        await this.notificationsService.send(t.owner_id, 'event_cancelled', {
          eventName: event.title,
          eventId: event.id,
        });
      }
    }

    return event;
  }

  async findOneBySlug(slug: string) {
    const event = await this.eventRepo.findOne({ where: { slug }});
    if (!event) throw new NotFoundException();
    const tiers = await this.tierRepo.find({ where: { event_id: event.id }});
    return { ...event, tiers };
  }

  async requestPartialPayout(eventId: string, hostId: string) {
     const settlement = await this.settlementRepo.findOne({ where: { event_id: eventId, host_id: hostId }});
     if (!settlement) throw new BadRequestException('Settlement not found');

     const event = await this.eventRepo.findOne({ where: { id: eventId }});
     if (!event) throw new NotFoundException();

     const configRow = await this.configRepo.findOne({ where: { key: 'buyback_window_hours' }});
     const windowHours = configRow ? parseInt(configRow.value) : 48;
     
     const msUntilEvent = event.starts_at.getTime() - Date.now();
     if (msUntilEvent > (windowHours * 60 * 60 * 1000)) {
         throw new BadRequestException('Cannot request partial payout until buy-back window has closed');
     }

     const qr = await this.ticketRepo.query(`
        SELECT COALESCE(SUM(tier.price_minor), 0) as gross
        FROM tickets t
        JOIN ticket_tiers tier ON t.tier_id = tier.id
        WHERE t.event_id = $1 AND (t.status = 'PAID' OR t.status = 'ISSUED' OR t.status = 'VALIDATED')
     `, [eventId]);
     const cap = await this.tierRepo.query(`SELECT SUM(total_quantity) as total FROM ticket_tiers WHERE event_id = $1`, [eventId]);

     const grossRevenue = parseInt(qr[0].gross);
     const totalCapacity = parseInt(cap[0].total) || 0;

     const commissionObj = await this.pricingService.calculateHostCommission(totalCapacity, grossRevenue);
     const netRevenue = grossRevenue - commissionObj.commission;
     const maxAllowed = Math.round(netRevenue * 0.70);

     if (settlement.partial_payout_minor > 0) throw new BadRequestException('Partial payout already processed');

     settlement.gross_revenue_minor = grossRevenue;
     settlement.host_commission_minor = commissionObj.commission;
     settlement.partial_payout_minor = maxAllowed;
     settlement.status = 'partial_paid';
     settlement.partial_paid_at = new Date();
     await this.settlementRepo.save(settlement);

     return { message: 'Partial payout processed', amount_minor: maxAllowed };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processFinalSettlements() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events = await this.eventRepo.find({ where: { ends_at: LessThanOrEqual(yesterday) } });
    for (const e of events) {
      const settlement = await this.settlementRepo.findOne({ where: { event_id: e.id } });
      if (settlement && settlement.status !== 'settled') {
        // Recalculate gross from DB in case no partial payout was requested
        const qr = await this.ticketRepo.query(`
          SELECT COALESCE(SUM(tier.price_minor), 0) as gross
          FROM tickets t
          JOIN ticket_tiers tier ON t.tier_id = tier.id
          WHERE t.event_id = $1 AND (t.status = 'PAID' OR t.status = 'ISSUED' OR t.status = 'VALIDATED')
        `, [e.id]);
        const cap = await this.tierRepo.query(`SELECT SUM(total_quantity) as total FROM ticket_tiers WHERE event_id = $1`, [e.id]);
        const grossRevenue = parseInt(qr[0].gross) || 0;
        const totalCapacity = parseInt(cap[0].total) || 0;

        const commissionObj = await this.pricingService.calculateHostCommission(totalCapacity, grossRevenue);
        settlement.gross_revenue_minor = grossRevenue;
        settlement.host_commission_minor = commissionObj.commission;
        settlement.commission_rate = commissionObj.rate;
        settlement.commission_tier = commissionObj.tier;
        settlement.net_payout_minor = grossRevenue - commissionObj.commission;

        const rest = grossRevenue - commissionObj.commission - (settlement.partial_payout_minor || 0);
        if (rest > 0) {
          settlement.final_payout_minor = rest;
          settlement.status = 'settled';
          settlement.settled_at = new Date();
          await this.settlementRepo.save(settlement);

          // Notify host about final settlement
          await this.notificationsService.send(e.host_id, 'host_payout_settled', {
            eventName: e.title,
            amount_minor: rest,
          });
        }
      }
    }
  }

  // ── 24h Event Reminder ─── Daily at 10:00 WAT (09:00 UTC)
  @Cron('0 9 * * *')
  async send24hReminders() {
    const now = Date.now();
    const from = new Date(now + 23 * 60 * 60 * 1000);
    const to = new Date(now + 25 * 60 * 60 * 1000);

    const events = await this.eventRepo
      .createQueryBuilder('e')
      .where("UPPER(e.status) = 'PUBLISHED'")
      .andWhere('e.starts_at >= :from', { from })
      .andWhere('e.starts_at <= :to', { to })
      .getMany();

    for (const event of events) {
      const tickets = await this.ticketRepo.find({ where: { event_id: event.id, status: 'ISSUED' } });
      for (const t of tickets) {
        if (t.owner_id) {
          await this.notificationsService.send(t.owner_id, 'event_reminder_24h', {
            eventName: event.title,
            startsAt: event.starts_at,
            venueName: event.venue_name,
          });
        }
      }
    }
  }

  // ── 2h Event Reminder ─── Every 30 minutes
  @Cron('0 */30 * * * *')
  async send2hReminders() {
    const now = Date.now();
    const from = new Date(now + 1.5 * 60 * 60 * 1000);
    const to = new Date(now + 2.5 * 60 * 60 * 1000);

    const events = await this.eventRepo
      .createQueryBuilder('e')
      .where("UPPER(e.status) = 'PUBLISHED'")
      .andWhere('e.starts_at >= :from', { from })
      .andWhere('e.starts_at <= :to', { to })
      .getMany();

    for (const event of events) {
      const tickets = await this.ticketRepo.find({ where: { event_id: event.id, status: 'ISSUED' } });
      for (const t of tickets) {
        if (t.owner_id) {
          await this.notificationsService.send(t.owner_id, 'event_reminder_2h', {
            eventName: event.title,
            startsAt: event.starts_at,
            venueName: event.venue_name,
          });
        }
      }
    }
  }

  // ── Event Expiry ─── Every hour, batch-transition tickets after event ends
  @Cron(CronExpression.EVERY_HOUR)
  async expireFinishedEventTickets() {
    const now = new Date();
    const finishedEvents = await this.eventRepo.find({
      where: { ends_at: LessThanOrEqual(now) },
    });

    for (const event of finishedEvents) {
      const tickets = await this.ticketRepo.find({ where: { event_id: event.id } });
      for (const t of tickets) {
        const upper = t.status.toUpperCase();
        if (upper === 'ISSUED' || upper === 'VALIDATED') {
          t.status = 'EVENT_EXPIRED';
          await this.ticketRepo.save(t);
        }
      }
      // Mark event as completed
      event.status = 'completed';
      await this.eventRepo.save(event);
    }
  }

  async getMyEvents(hostId: string) {
    return this.eventRepo.find({ where: { host_id: hostId }, order: { created_at: 'DESC' } });
  }

  async getAttendedEvents(userId: string) {
    return this.eventRepo
      .createQueryBuilder('e')
      .innerJoin('tickets', 't', 't.event_id = e.id')
      .where('t.owner_id = :userId', { userId })
      .orderBy('e.starts_at', 'DESC')
      .distinct(true)
      .getMany();
  }
}
