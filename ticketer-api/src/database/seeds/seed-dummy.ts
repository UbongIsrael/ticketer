import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Event } from '../../modules/events/entities/event.entity';
import { TicketTier } from '../../modules/events/entities/ticket-tier.entity';

async function seed() {
  await AppDataSource.initialize();
  
  const userRepo = AppDataSource.getRepository(User);
  const eventRepo = AppDataSource.getRepository(Event);
  const ticketTierRepo = AppDataSource.getRepository(TicketTier);

  console.log('Seeding dummy data...');

  // Create a Host User
  const host = userRepo.create({
    email: 'host@ticketer.test',
    phone: '+2348000000000',
    name: 'Ticketer Demo Host',
    auth_provider: 'email',
    capabilities: ['BUYER', 'HOST']
  });
  await userRepo.save(host);

  // Future dates
  const today = new Date();
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(nextWeekEnd.getHours() + 5);

  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const nextMonthEnd = new Date(nextMonth);
  nextMonthEnd.setDate(nextMonthEnd.getDate() + 2);

  // Event 1: Tech Conference
  const event1 = eventRepo.create({
    host_id: host.id,
    title: 'Lagos Tech Summit 2026',
    description: 'The biggest technology conference in Lagos, featuring AI, Web3, and future tech.',
    slug: 'lagos-tech-summit-2026',
    cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    venue_name: 'Eko Convention Center',
    venue_address: 'Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos',
    city: 'Lagos',
    state: 'Lagos',
    event_type: 'Conference',
    starts_at: nextMonth,
    ends_at: nextMonthEnd,
    status: 'PUBLISHED',
    published_at: today,
    currency: 'NGN',
    latitude: 6.4253,
    longitude: 3.4214
  });
  await eventRepo.save(event1);

  // Ticket Tiers for Event 1
  await ticketTierRepo.save([
    {
      event_id: event1.id,
      name: 'General Admission',
      price_minor: 1000000, // 10,000 NGN
      total_quantity: 500,
      description: 'Access to all main stages and exhibition areas.',
      perks: ['Main Stage Access', 'Exhibition Area'],
      sale_starts_at: today,
      sale_ends_at: nextMonth
    },
    {
      event_id: event1.id,
      name: 'VIP Pass',
      price_minor: 5000000, // 50,000 NGN
      total_quantity: 50,
      description: 'Exclusive access to VIP lounge, networking events, and front-row seating.',
      perks: ['VIP Lounge', 'Networking Lunch', 'Front-row Seating'],
      sale_starts_at: today,
      sale_ends_at: nextMonth
    }
  ]);

  // Event 2: Music Festival
  const event2 = eventRepo.create({
    host_id: host.id,
    title: 'Afrobeats Festival Lagos',
    description: 'A spectacular night of music and culture with top artists.',
    slug: 'afrobeats-festival-lagos',
    cover_image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    venue_name: 'Tafawa Balewa Square',
    venue_address: 'Tafawa Balewa Square, Lagos Island',
    city: 'Lagos',
    state: 'Lagos',
    event_type: 'Concert',
    starts_at: nextWeek,
    ends_at: nextWeekEnd,
    status: 'PUBLISHED',
    published_at: today,
    currency: 'NGN'
  });
  await eventRepo.save(event2);

  // Ticket Tiers for Event 2
  await ticketTierRepo.save([
    {
      event_id: event2.id,
      name: 'Regular',
      price_minor: 500000, // 5,000 NGN
      total_quantity: 2000,
      description: 'General standing area.',
      sale_starts_at: today,
      sale_ends_at: nextWeek
    },
    {
      event_id: event2.id,
      name: 'VVIP Table for 4',
      price_minor: 50000000, // 500,000 NGN
      total_quantity: 20,
      description: 'Premium table with drinks and dedicated service.',
      perks: ['Premium Drinks', 'Dedicated Server', 'Backstage Access'],
      sale_starts_at: today,
      sale_ends_at: nextWeek
    }
  ]);

  console.log('Dummy data inserted successfully!');
  await AppDataSource.destroy();
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
