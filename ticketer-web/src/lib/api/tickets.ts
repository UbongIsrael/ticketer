import { api } from '../axios';

export interface Ticket {
  id: string;
  tier_id: string;
  event_id: string;
  buyer_id: string;
  ticket_code: string;
  qr_payload: string;
  price_paid_minor: number;
  service_fee_minor: number;
  status: 'RESERVED' | 'PAYMENT_PENDING' | 'ISSUED' | 'VALIDATED' | 'VOIDED' | 'REFUNDED' | 'EVENT_EXPIRED';
  reserved_until: string | null;
  payment_reference: string | null;
  validated_at: string | null;
  voided_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithDetails extends Ticket {
  event: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    venue_name: string;
    venue_address: string;
    starts_at: string;
    ends_at: string;
    city: string;
  };
  tier: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface ReserveTicketRequest {
  event_id: string;
  tier_id: string;
  quantity: number;
}

export interface ReserveTicketResponse {
  tickets: Ticket[];
  reservation_expires_at: string;
}

// Reserve a ticket (starts 10-min timer)
export const reserveTicket = async (data: ReserveTicketRequest): Promise<ReserveTicketResponse> => {
  const response = await api.post('/tickets/reserve', data);
  return response.data;
};

// Cancel reservation
export const cancelReservation = async (ticketId: string): Promise<void> => {
  await api.delete(`/tickets/reserve/${ticketId}`);
};

// List my tickets
export const getMyTickets = async (): Promise<TicketWithDetails[]> => {
  const response = await api.get('/tickets/me');
  return response.data;
};

// Get single ticket detail + QR
export const getTicketById = async (ticketId: string): Promise<TicketWithDetails> => {
  const response = await api.get(`/tickets/me/${ticketId}`);
  return response.data;
};
