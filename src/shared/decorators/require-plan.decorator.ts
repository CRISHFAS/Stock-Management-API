import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../interfaces/subscription.interface';

export const RequirePlan = (plan: SubscriptionPlan) =>
  SetMetadata('requiredPlan', plan);
