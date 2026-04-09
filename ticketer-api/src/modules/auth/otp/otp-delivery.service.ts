import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  async sendOtp(identifier: string, code: string): Promise<boolean> {
    this.logger.log(`Attempting to deliver OTP ${code} to ${identifier}...`);
    const methods = ['WhatsApp', 'SMS', 'Email'];
    for (const method of methods) {
      try {
        await this.mockProvider(method, identifier, code);
        this.logger.log(`OTP successfully delivered via ${method}`);
        return true;
      } catch (error) {
        this.logger.warn(`Failed delivering via ${method}, falling back...`);
      }
    }
    
    this.logger.error(`All OTP delivery methods failed for ${identifier}`);
    return false;
  }

  private async mockProvider(method: string, dest: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const success = Math.random() > 0.1;
      setTimeout(() => {
        if (success) {
          console.log(`[Mock ${method}] Sent: Your Ticketer code is ${code}`);
          resolve();
        } else {
          reject(new Error(`Simulated ${method} failure`));
        }
      }, 200);
    });
  }
}
