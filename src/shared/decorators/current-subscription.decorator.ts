import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Subscription } from '../interfaces/subscription.interface';

export const CurrentSubscription = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Subscription => {
    const request = ctx.switchToHttp().getRequest();
    return request.subscription;
  },
);
