import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { CurrentSubscription } from '../shared/decorators/current-subscription.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RequirePlan } from '../shared/decorators/require-plan.decorator';

import type { User } from '../shared/interfaces/user.interface';
import type { Subscription } from '../shared/interfaces/subscription.interface';
import { SubscriptionPlan } from '../shared/interfaces/subscription.interface';
import { ResponseUtil } from '../shared/utils/response.util';
import { SUBSCRIPTION_PLANS } from '../shared/constants/subscription.constants';
import { UserRole } from '../shared/interfaces/user.interface';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nueva suscripción',
    description:
      'Crear una suscripción a un plan específico con el proveedor de pago seleccionado',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Suscripción creada exitosamente con URL de pago',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Suscripción creada exitosamente' },
        data: {
          type: 'object',
          properties: {
            subscription: {
              $ref: '#/components/schemas/SubscriptionResponseDto',
            },
            paymentUrl: {
              type: 'string',
              example: 'https://checkout.stripe.com/pay/...',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'El usuario ya tiene una suscripción activa',
  })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.subscriptionsService.createSubscription(
      createSubscriptionDto,
      user,
    );

    const planConfig = SUBSCRIPTION_PLANS[result.subscription.plan];
    const responseData = {
      subscription: {
        ...result.subscription,
        planDetails: {
          name: planConfig.name,
          maxProducts: planConfig.maxProducts,
          features: planConfig.features,
        },
        daysUntilExpiry: this.subscriptionsService.getDaysUntilExpiry(
          result.subscription,
        ),
        isActive: this.subscriptionsService.isActive(result.subscription),
        isInTrial: this.subscriptionsService.isInTrial(result.subscription),
      },
      paymentUrl: result.paymentUrl,
    };

    return ResponseUtil.success(
      responseData,
      'Suscripción creada exitosamente. Completa el pago para activarla.',
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener mi suscripción',
    description:
      'Información detallada de la suscripción del usuario autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Información de suscripción obtenida exitosamente',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'El usuario no tiene suscripción',
  })
  async getMySubscription(@CurrentUser() user: User) {
    const subscription = await this.subscriptionsService.findByUserId(user.id);

    if (!subscription) {
      return ResponseUtil.success(null, 'No tienes una suscripción activa');
    }

    const planConfig = SUBSCRIPTION_PLANS[subscription.plan];
    const responseData = {
      ...subscription,
      planDetails: {
        name: planConfig.name,
        maxProducts: planConfig.maxProducts,
        features: planConfig.features,
      },
      daysUntilExpiry:
        this.subscriptionsService.getDaysUntilExpiry(subscription),
      isActive: this.subscriptionsService.isActive(subscription),
      isInTrial: this.subscriptionsService.isInTrial(subscription),
    };

    return ResponseUtil.success(
      responseData,
      'Información de suscripción obtenida exitosamente',
    );
  }

  @Get('plans')
  @ApiOperation({
    summary: 'Listar planes disponibles',
    description:
      'Obtener información de todos los planes de suscripción disponibles',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Planes obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              plan: { type: 'string', enum: Object.values(SubscriptionPlan) },
              name: { type: 'string', example: 'Plan Premium' },
              price: { type: 'number', example: 20000 },
              currency: { type: 'string', example: 'ARS' },
              maxProducts: { type: 'number', example: 500 },
              features: {
                type: 'array',
                items: { type: 'string' },
                example: ['Integración ML', 'Reportes avanzados'],
              },
            },
          },
        },
      },
    },
  })
  getPlans() {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([plan, config]) => ({
      plan: plan as SubscriptionPlan,
      ...config,
      recommended: plan === SubscriptionPlan.PREMIUM,
    }));

    return ResponseUtil.success(plans, 'Planes obtenidos exitosamente');
  }

  @Patch('upgrade')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({
    summary: 'Cambiar plan de suscripción',
    description:
      'Actualizar la suscripción a un plan diferente con prorrateado automático',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Se requiere suscripción activa',
  })
  async upgradeSubscription(
    @Body() updateDto: UpdateSubscriptionDto,
    @CurrentSubscription() subscription: Subscription,
  ) {
    const updatedSubscription =
      await this.subscriptionsService.updateSubscription(
        subscription.id,
        updateDto,
      );

    const planConfig = SUBSCRIPTION_PLANS[updatedSubscription.plan];
    const responseData = {
      ...updatedSubscription,
      planDetails: {
        name: planConfig.name,
        maxProducts: planConfig.maxProducts,
        features: planConfig.features,
      },
      daysUntilExpiry:
        this.subscriptionsService.getDaysUntilExpiry(updatedSubscription),
      isActive: this.subscriptionsService.isActive(updatedSubscription),
      isInTrial: this.subscriptionsService.isInTrial(updatedSubscription),
    };

    return ResponseUtil.success(responseData, 'Plan actualizado exitosamente');
  }

  @Delete('cancel')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({
    summary: 'Cancelar suscripción',
    description:
      'Cancelar la suscripción actual. La suscripción permanecerá activa hasta el final del periodo pagado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suscripción cancelada exitosamente',
  })
  async cancelSubscription(@CurrentSubscription() subscription: Subscription) {
    const cancelledSubscription =
      await this.subscriptionsService.cancelSubscription(subscription.id);

    return ResponseUtil.success(
      {
        ...cancelledSubscription,
        daysUntilExpiry: this.subscriptionsService.getDaysUntilExpiry(
          cancelledSubscription,
        ),
      },
      'Suscripción cancelada exitosamente. Seguirás teniendo acceso hasta el final del periodo pagado.',
    );
  }

  @Post('renew/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Renovar suscripción (Solo Admin)',
    description: 'Renovar manualmente una suscripción expirada o cancelada',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suscripción renovada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Se requiere rol de administrador',
  })
  async renewSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const renewedSubscription =
      await this.subscriptionsService.renewSubscription(id);

    return ResponseUtil.success(
      renewedSubscription,
      'Suscripción renovada exitosamente',
    );
  }

  // Endpoints administrativos
  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estadísticas de suscripciones (Solo Admin)',
    description: 'Obtener métricas y estadísticas de todas las suscripciones',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            active: { type: 'number', example: 120 },
            trial: { type: 'number', example: 25 },
            expired: { type: 'number', example: 20 },
            cancelled: { type: 'number', example: 10 },
            monthlyRevenue: { type: 'number', example: 2400000 },
            plans: {
              type: 'object',
              properties: {
                basic: { type: 'number', example: 60 },
                premium: { type: 'number', example: 50 },
                enterprise: { type: 'number', example: 10 },
              },
            },
          },
        },
      },
    },
  })
  async getSubscriptionStats() {
    const stats = await this.subscriptionsService.getSubscriptionStats();
    return ResponseUtil.success(stats, 'Estadísticas obtenidas exitosamente');
  }

  @Get('admin/expiring')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Suscripciones por expirar (Solo Admin)',
    description:
      'Obtener lista de suscripciones que expiran en los próximos 7 días',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suscripciones por expirar obtenidas exitosamente',
  })
  async getExpiringSubscriptions() {
    const expiring =
      await this.subscriptionsService.getExpiringSubscriptions(7);

    return ResponseUtil.success(
      expiring.map((sub) => ({
        ...sub,
        daysUntilExpiry: this.subscriptionsService.getDaysUntilExpiry(sub),
      })),
      `${expiring.length} suscripciones expiran en los próximos 7 días`,
    );
  }

  // Funcionalidades que requieren planes específicos
  @Get('premium-feature')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Funcionalidad Premium (Requiere Plan Premium+)',
    description: 'Ejemplo de endpoint que requiere Plan Premium o Enterprise',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Acceso a funcionalidad premium autorizado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Se requiere Plan Premium o superior',
  })
  premiumFeature(@CurrentSubscription() subscription: Subscription) {
    return ResponseUtil.success(
      {
        message: 'Acceso autorizado a funcionalidad premium',
        plan: subscription.plan,
        features: subscription.planLimits.features,
      },
      'Funcionalidad premium disponible',
    );
  }
}
