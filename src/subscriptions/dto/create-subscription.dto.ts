import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  PaymentProvider,
} from '../../shared/interfaces/subscription.interface';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: SubscriptionPlan.PREMIUM,
    description: 'Plan de suscripción seleccionado',
    enum: SubscriptionPlan,
  })
  @IsEnum(SubscriptionPlan, { message: 'Plan de suscripción inválido' })
  plan: SubscriptionPlan;

  @ApiProperty({
    example: PaymentProvider.MERCADOPAGO,
    description: 'Proveedor de pago',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider, { message: 'Proveedor de pago inválido' })
  paymentProvider: PaymentProvider;

  @ApiPropertyOptional({
    example: 'PROMO2024',
    description: 'Código promocional opcional',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
