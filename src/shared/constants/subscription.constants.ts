import {
  SubscriptionPlan,
  SubscriptionPlanConfig,
} from '../interfaces/subscription.interface';

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  SubscriptionPlanConfig
> = {
  [SubscriptionPlan.BASIC]: {
    name: 'Plan Básico',
    price: 10000,
    currency: 'ARS',
    maxProducts: 100,
    features: [
      'Gestión básica de stock',
      'Alertas de stock bajo',
      'Reportes básicos',
      'Soporte por email',
    ],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    mercadoPagoPlanId: process.env.MP_BASIC_PLAN_ID,
  },
  [SubscriptionPlan.PREMIUM]: {
    name: 'Plan Premium',
    price: 20000,
    currency: 'ARS',
    maxProducts: 500,
    features: [
      'Todo lo del Plan Básico',
      'Integración con MercadoLibre',
      'Sincronización automática',
      'Reportes avanzados',
      'Múltiples usuarios',
      'Soporte prioritario',
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    mercadoPagoPlanId: process.env.MP_PREMIUM_PLAN_ID,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Plan Enterprise',
    price: 30000,
    currency: 'ARS',
    maxProducts: -1, // Ilimitado
    features: [
      'Todo lo del Plan Premium',
      'Productos ilimitados',
      'API access completo',
      'Webhooks personalizados',
      'Integraciones custom',
      'Account manager dedicado',
      'Soporte 24/7',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    mercadoPagoPlanId: process.env.MP_ENTERPRISE_PLAN_ID,
  },
};

export const SUBSCRIPTION_CONSTANTS = {
  TRIAL_DAYS: 7,
  GRACE_PERIOD_DAYS: 3,
  INVOICE_DUE_DAYS: 30,
  MAX_RETRY_ATTEMPTS: 3,
  WEBHOOK_TIMEOUT: 10000,
} as const;
