import { SetMetadata } from '@nestjs/common';

export const RequiresCapability = (...capabilities: string[]) => SetMetadata('capabilities', capabilities);
