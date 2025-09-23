import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentProvider,
} from '../../shared/interfaces/subscription.interface';

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: SubscriptionPlan.PREMIUM, enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty({ example: SubscriptionStatus.ACTIVE, enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ example: 20000 })
  price: number;

  @ApiProperty({ example: 'ARS' })
  currency: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: '2024-01-08T00:00:00.000Z' })
  trialEndDate?: Date;

  @ApiProperty({ example: PaymentProvider.MERCADOPAGO, enum: PaymentProvider })
  paymentProvider: PaymentProvider;

  @ApiProperty({
    example: {
      name: 'Plan Premium',
      maxProducts: 500,
      features: ['Integración ML', 'Reportes avanzados'],
    },
  })
  planDetails: {
    name: string;
    maxProducts: number;
    features: string[];
  };

  @ApiProperty({ example: 15 })
  daysUntilExpiry: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isInTrial: boolean;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z' })
  nextPaymentDate?: Date;
}
