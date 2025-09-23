export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  MERCADOPAGO = 'mercadopago',
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;

  // Payment provider info
  paymentProvider: PaymentProvider;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  mercadoPagoSubscriptionId?: string;
  mercadoPagoCustomerId?: string;

  // Metadata
  planLimits: {
    maxProducts: number;
    features: string[];
  };

  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
}

export interface SubscriptionPlanConfig {
  name: string;
  price: number;
  currency: string;
  maxProducts: number;
  features: string[];
  stripePriceId?: string;
  mercadoPagoPlanId?: string;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  subscriptionId?: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  paymentProvider: PaymentProvider;
  providerPaymentId: string;
  createdAt: Date;
  paidAt?: Date;
}
