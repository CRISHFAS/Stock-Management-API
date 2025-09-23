import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '../../shared/interfaces/subscription.interface';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: SubscriptionPlan.ENTERPRISE,
    description: 'Cambiar a nuevo plan',
    enum: SubscriptionPlan,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  newPlan?: SubscriptionPlan;
}
