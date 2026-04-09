import { registerAs } from '@nestjs/config';

export default registerAs('paystack', () => ({
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  secretKey: process.env.PAYSTACK_SECRET_KEY,
}));
