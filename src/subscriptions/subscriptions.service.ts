import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentProvider,
  PaymentIntent,
} from '../shared/interfaces/subscription.interface';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_CONSTANTS,
} from '../shared/constants/subscription.constants';
import { User } from '../shared/interfaces/user.interface';

@Injectable()
export class SubscriptionsService {
  private subscriptions: Subscription[] = [
    // Suscripción demo
    {
      id: 'sub-demo-001',
      userId: 'user-demo-001',
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      price: 20000,
      currency: 'ARS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-01'),
      paymentProvider: PaymentProvider.MERCADOPAGO,
      mercadoPagoCustomerId: 'mp-customer-001',
      mercadoPagoSubscriptionId: 'mp-sub-001',
      planLimits: {
        maxProducts: 500,
        features: SUBSCRIPTION_PLANS[SubscriptionPlan.PREMIUM].features,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      lastPaymentDate: new Date('2024-01-01'),
      nextPaymentDate: new Date('2024-02-01'),
    },
  ];

  private paymentIntents: PaymentIntent[] = [];

  constructor(private configService: ConfigService) {}

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
    user: User,
  ): Promise<{
    subscription: Subscription;
    paymentUrl?: string;
  }> {
    // Verificar si ya tiene una suscripción activa
    const existingSubscription = await this.findActiveByUserId(user.id);
    if (existingSubscription) {
      throw new ConflictException('El usuario ya tiene una suscripción activa');
    }

    const planConfig = SUBSCRIPTION_PLANS[createSubscriptionDto.plan];
    const now = new Date();
    const trialEndDate = new Date(
      now.getTime() + SUBSCRIPTION_CONSTANTS.TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    // Crear suscripción
    const subscription: Subscription = {
      id: uuid(),
      userId: user.id,
      plan: createSubscriptionDto.plan,
      status: SubscriptionStatus.PENDING,
      price: planConfig.price,
      currency: planConfig.currency,
      startDate: now,
      endDate,
      trialEndDate,
      paymentProvider: createSubscriptionDto.paymentProvider,
      planLimits: {
        maxProducts: planConfig.maxProducts,
        features: planConfig.features,
      },
      createdAt: now,
      updatedAt: now,
      nextPaymentDate: trialEndDate, // Primer pago después del trial
    };

    // Crear payment intent
    const paymentIntent = await this.createPaymentIntent(subscription, user);

    this.subscriptions.push(subscription);

    return {
      subscription,
      paymentUrl: paymentIntent.providerPaymentId, // En implementación real sería la URL
    };
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptions.find((sub) => sub.userId === userId) || null;
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    return (
      this.subscriptions.find(
        (sub) =>
          sub.userId === userId &&
          sub.status === SubscriptionStatus.ACTIVE &&
          sub.endDate > new Date(),
      ) || null
    );
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptions.find((sub) => sub.id === id) || null;
  }

  async updateSubscription(
    id: string,
    updateDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscriptionIndex = this.subscriptions.findIndex(
      (sub) => sub.id === id,
    );

    if (subscriptionIndex === -1) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const subscription = this.subscriptions[subscriptionIndex];

    if (updateDto.newPlan) {
      const newPlanConfig = SUBSCRIPTION_PLANS[updateDto.newPlan];

      // Calcular prorrateado si es upgrade/downgrade
      const prorationAmount = this.calculateProration(
        subscription,
        updateDto.newPlan,
      );

      subscription.plan = updateDto.newPlan;
      subscription.price = newPlanConfig.price;
      subscription.planLimits = {
        maxProducts: newPlanConfig.maxProducts,
        features: newPlanConfig.features,
      };
      subscription.updatedAt = new Date();

      // En implementación real, crear cargo por prorrateado
      console.log(`Proration amount: $${prorationAmount}`);
    }

    this.subscriptions[subscriptionIndex] = subscription;
    return subscription;
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const subscriptionIndex = this.subscriptions.findIndex(
      (sub) => sub.id === id,
    );

    if (subscriptionIndex === -1) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const subscription = this.subscriptions[subscriptionIndex];

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.updatedAt = new Date();

    this.subscriptions[subscriptionIndex] = subscription;

    // En implementación real, cancelar en el proveedor de pagos
    await this.cancelWithProvider(subscription);

    return subscription;
  }

  async renewSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('La suscripción ya está activa');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = new Date();
    subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    subscription.updatedAt = new Date();
    subscription.lastPaymentDate = new Date();
    subscription.nextPaymentDate = new Date(subscription.endDate);

    return subscription;
  }

  // Métodos de utilidad
  async getSubscriptionStats() {
    const total = this.subscriptions.length;
    const active = this.subscriptions.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE,
    ).length;
    const trial = this.subscriptions.filter((s) => this.isInTrial(s)).length;
    const expired = this.subscriptions.filter(
      (s) => s.status === SubscriptionStatus.EXPIRED,
    ).length;

    const revenue = this.subscriptions
      .filter((s) => s.status === SubscriptionStatus.ACTIVE)
      .reduce((sum, s) => sum + s.price, 0);

    return {
      total,
      active,
      trial,
      expired,
      cancelled: this.subscriptions.filter(
        (s) => s.status === SubscriptionStatus.CANCELLED,
      ).length,
      monthlyRevenue: revenue,
      plans: {
        basic: this.subscriptions.filter(
          (s) => s.plan === SubscriptionPlan.BASIC,
        ).length,
        premium: this.subscriptions.filter(
          (s) => s.plan === SubscriptionPlan.PREMIUM,
        ).length,
        enterprise: this.subscriptions.filter(
          (s) => s.plan === SubscriptionPlan.ENTERPRISE,
        ).length,
      },
    };
  }

  async getExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.subscriptions.filter(
      (sub) =>
        sub.status === SubscriptionStatus.ACTIVE &&
        sub.endDate <= expiryDate &&
        sub.endDate > new Date(),
    );
  }

  // Métodos helper
  isInTrial(subscription: Subscription): boolean {
    if (!subscription.trialEndDate) return false;
    const now = new Date();
    return now >= subscription.startDate && now <= subscription.trialEndDate;
  }

  getDaysUntilExpiry(subscription: Subscription): number {
    const now = new Date();
    const diffTime = subscription.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  isActive(subscription: Subscription): boolean {
    return (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate > new Date()
    );
  }

  private async createPaymentIntent(
    subscription: Subscription,
    user: User,
  ): Promise<PaymentIntent> {
    const paymentIntent: PaymentIntent = {
      id: uuid(),
      userId: user.id,
      subscriptionId: subscription.id,
      plan: subscription.plan,
      amount: subscription.price,
      currency: subscription.currency,
      status: 'pending',
      paymentProvider: subscription.paymentProvider,
      providerPaymentId: `${subscription.paymentProvider}_${Date.now()}`, // Simulated
      createdAt: new Date(),
    };

    this.paymentIntents.push(paymentIntent);
    return paymentIntent;
  }

  private calculateProration(
    subscription: Subscription,
    newPlan: SubscriptionPlan,
  ): number {
    const currentPlanConfig = SUBSCRIPTION_PLANS[subscription.plan];
    const newPlanConfig = SUBSCRIPTION_PLANS[newPlan];

    const daysRemaining = this.getDaysUntilExpiry(subscription);
    const dailyCurrentRate = currentPlanConfig.price / 30;
    const dailyNewRate = newPlanConfig.price / 30;

    return (dailyNewRate - dailyCurrentRate) * daysRemaining;
  }

  private async cancelWithProvider(subscription: Subscription): Promise<void> {
    // En implementación real, cancelar con Stripe o MercadoPago
    console.log(
      `Cancelling subscription ${subscription.id} with ${subscription.paymentProvider}`,
    );
  }
}
