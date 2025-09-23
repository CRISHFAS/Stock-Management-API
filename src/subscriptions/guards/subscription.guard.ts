import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionPlan } from '../../shared/interfaces/subscription.interface';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener suscripción activa del usuario
    const subscription = await this.subscriptionsService.findActiveByUserId(
      user.id,
    );

    if (!subscription) {
      throw new ForbiddenException(
        'Se requiere suscripción activa para acceder a esta funcionalidad',
      );
    }

    if (!this.subscriptionsService.isActive(subscription)) {
      throw new ForbiddenException(
        'Tu suscripción ha expirado. Renueva tu plan para continuar.',
      );
    }

    // Verificar límites de plan si se especifican
    const requiredPlan = this.reflector.get<SubscriptionPlan>(
      'requiredPlan',
      context.getHandler(),
    );
    if (requiredPlan) {
      if (!this.hasRequiredPlan(subscription.plan, requiredPlan)) {
        const planNames = {
          basic: 'Plan Básico',
          premium: 'Plan Premium',
          enterprise: 'Plan Enterprise',
        };
        throw new ForbiddenException(
          `Esta funcionalidad requiere ${planNames[requiredPlan]} o superior`,
        );
      }
    }

    // Agregar información de suscripción al request
    request.subscription = subscription;
    return true;
  }

  private hasRequiredPlan(
    userPlan: SubscriptionPlan,
    requiredPlan: SubscriptionPlan,
  ): boolean {
    const planHierarchy = {
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PREMIUM]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3,
    };

    return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
  }
}
