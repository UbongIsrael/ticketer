import { api } from '../axios';

export interface InitializePaymentRequest {
  ticket_id: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Initialize payment with Paystack
export const initializePayment = async (data: InitializePaymentRequest): Promise<InitializePaymentResponse> => {
  const response = await api.post('/payments/initialize', data);
  return response.data;
};
