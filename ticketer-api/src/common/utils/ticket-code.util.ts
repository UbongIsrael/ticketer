  import * as crypto from 'crypto';

export function generateTicketCode(): string {
  const prefix = 'EVT';
  const year = new Date().getFullYear();
  // Generate random 4-character hex string (uppercase)
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${year}-${randomPart}`;
}
