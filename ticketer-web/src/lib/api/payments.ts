import { api } from '../axios';



export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Initialize payment for reserved tickets
export const initializePayment = async (data: { ticket_ids: string[] }): Promise<InitializePaymentResponse> => {
  const response = await api.post('/payments/initialize', data);
  return response.data;
};
