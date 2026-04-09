import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCapabilities = this.reflector.get<string[]>('capabilities', context.getHandler());
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.capabilities) return false;
    
    return requiredCapabilities.some((capability) => user.capabilities.includes(capability));
  }
}
