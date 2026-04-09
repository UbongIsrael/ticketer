import * as crypto from 'crypto';

export function generateQrPayload(ticketId: string, eventId: string, secret: string): string {
  const data = `${ticketId}:${eventId}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('hex');
  return `${data}:${signature}`;
}

export function verifyQrPayload(payload: string, secret: string): { isValid: boolean; ticketId?: string; eventId?: string } {
  const parts = payload.split(':');
  if (parts.length !== 3) return { isValid: false };
  const [ticketId, eventId, signature] = parts;
  
  const expectedHmac = crypto.createHmac('sha256', secret);
  expectedHmac.update(`${ticketId}:${eventId}`);
  const expectedSignature = expectedHmac.digest('hex');
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    return { isValid, ticketId, eventId };
  } catch (e) {
    return { isValid: false };
  }
}
