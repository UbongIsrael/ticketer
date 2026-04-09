import { api } from '../axios';

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string;
  slug: string;
  cover_image_url: string | null;
  venue_name: string;
  venue_address: string;
  latitude: number | null;
  longitude: number | null;
  city: string;
  state: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  currency: string;
  metadata: any;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  price_minor: number;
  total_quantity: number;
  sold_count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithTiers extends Event {
  tiers: TicketTier[];
}

export interface EventsListParams {
  page?: number;
  limit?: number;
  city?: string;
  event_type?: string;
  starts_after?: string;
  starts_before?: string;
  search?: string;
}

export interface EventsListResponse {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// List published events (public, no auth required)
export const listEvents = async (params: EventsListParams = {}): Promise<EventsListResponse> => {
  const response = await api.get('/events', { params });
  return response.data;
};

// Get single event by slug (public, no auth required)
export const getEventBySlug = async (slug: string): Promise<EventWithTiers> => {
  const response = await api.get(`/events/slug/${slug}`);
  return response.data;
};

// Get weather forecast for event (public)
export const getEventWeather = async (slug: string): Promise<any> => {
  const response = await api.get(`/events/${slug}/weather`);
  return response.data;
};

// Create event (requires HOST capability)
export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  const response = await api.post('/events', eventData);
  return response.data;
};

// Update event (requires HOST capability)
export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  const response = await api.patch(`/events/${id}`, eventData);
  return response.data;
};

// Publish event (requires HOST capability)
export const publishEvent = async (id: string): Promise<Event> => {
  const response = await api.post(`/events/${id}/publish`);
  return response.data;
};

// Cancel event (requires HOST capability)
export const cancelEvent = async (id: string): Promise<Event> => {
  const response = await api.post(`/events/${id}/cancel`);
  return response.data;
};

// Add pricing tier (requires HOST capability)
export const addTier = async (eventId: string, tierData: Partial<TicketTier>): Promise<TicketTier> => {
  const response = await api.post(`/events/${eventId}/tiers`, tierData);
  return response.data;
};

// Update pricing tier (requires HOST capability)
export const updateTier = async (eventId: string, tierId: string, tierData: Partial<TicketTier>): Promise<TicketTier> => {
  const response = await api.patch(`/events/${eventId}/tiers/${tierId}`, tierData);
  return response.data;
};

// Get event analytics (requires HOST capability)
export const getEventAnalytics = async (eventId: string): Promise<any> => {
  const response = await api.get(`/events/${eventId}/analytics`);
  return response.data;
};

// Send announcement (requires HOST capability)
export const sendAnnouncement = async (eventId: string, message: string): Promise<any> => {
  const response = await api.post(`/events/${eventId}/announcements`, { message });
  return response.data;
};

// Get payout status (requires HOST capability)
export const getPayouts = async (eventId: string): Promise<any> => {
  const response = await api.get(`/events/${eventId}/payouts`);
  return response.data;
};

// Request partial payout (requires HOST capability)
export const requestPartialPayout = async (eventId: string, amount: number): Promise<any> => {
  const response = await api.post(`/events/${eventId}/payouts/request-partial`, { amount });
  return response.data;
};
