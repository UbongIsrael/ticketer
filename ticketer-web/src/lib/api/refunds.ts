import { api } from '../axios';

export interface RefundRequest {
  ticket_id: string;
  reason?: string;
}

export interface Refund {
  id: string;
  ticket_id: string;
  user_id: string;
  amount_minor: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  paystack_transfer_code: string | null;
  failure_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundWithDetails extends Refund {
  ticket: {
    id: string;
    ticket_code: string;
    event_id: string;
  };
  event: {
    id: string;
    title: string;
    starts_at: string;
  };
}

// Request buy-back refund
export const requestBuyback = async (data: RefundRequest): Promise<Refund> => {
  const response = await api.post('/refunds/buyback', data);
  return response.data;
};

// List my refunds
export const getMyRefunds = async (): Promise<RefundWithDetails[]> => {
  const response = await api.get('/me/refunds');
  return response.data;
};
