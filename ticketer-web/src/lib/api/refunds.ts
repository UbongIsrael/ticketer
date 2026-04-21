import { api } from '../axios';
import { Event, EventWithTiers, TicketTier } from './events';

export interface RefundRequest {
  ticket_id: string;
  reason?: string;
}

export interface Refund {
  id: string;
  ticket_id: string;
  user_id: string;
  type: string;
  original_amount_minor: number;
  refund_amount_minor: number;
  platform_margin_minor: number;
  status: string;
  provider: string;
  provider_reference: string | null;
  failure_reason: string | null;
  retry_count: number;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundWithDetails extends Refund {
  ticket: {
    id: string;
    ticket_code: string;
    event_id: string;
    event: {
      id: string;
      title: string;
      starts_at: string;
      cover_image_url: string | null;
    };
  };
}

// Request buy-back refund
export const requestBuyback = async (data: RefundRequest): Promise<{
  message: string;
  amount_minor: number;
  refund_id: string;
  mock_transfer_url: string;
}> => {
  const response = await api.post('/refunds/buyback', data);
  return response.data;
};

// List my refunds
export const getMyRefunds = async (): Promise<RefundWithDetails[]> => {
  const response = await api.get('/refunds/me');
  return response.data;
};
