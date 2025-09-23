import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  Redirect,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { MercadolibreService } from './mercadolibre.service';
import { MLAuthCallbackDto, MLAuthUrlDto } from './dto/ml-auth.dto';
import { MLSyncProductsDto } from './dto/ml-sync.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { RequirePlan } from '../shared/decorators/require-plan.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';

import type { User } from '../shared/interfaces/user.interface';
import { SubscriptionPlan } from '../shared/interfaces/subscription.interface';
import { ResponseUtil } from '../shared/utils/response.util';

@ApiTags('MercadoLibre')
@Controller('mercadolibre')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MercadolibreController {
  constructor(private readonly mercadolibreService: MercadolibreService) {}

  @Get('auth')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Iniciar autenticación con MercadoLibre',
    description:
      'Generar URL de autorización OAuth2 para conectar con MercadoLibre. Requiere Plan Premium o superior.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL de autorización generada exitosamente',
    type: MLAuthUrlDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Se requiere Plan Premium o superior',
  })
  async generateAuthUrl(@CurrentUser() user: User) {
    const authData = this.mercadolibreService.generateAuthUrl(user.id);

    return ResponseUtil.success(
      authData,
      'URL de autorización generada. Redirige al usuario para completar la conexión con MercadoLibre.',
    );
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Callback de autenticación OAuth2',
    description:
      'Endpoint para recibir el callback de MercadoLibre después de la autorización',
  })
  @ApiQuery({
    name: 'code',
    description: 'Código de autorización devuelto por MercadoLibre',
    example: 'TG-507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'state',
    description: 'Estado para validar la solicitud',
    example: 'user123_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autenticación completada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error en el proceso de autenticación',
  })
  async handleCallback(@Query() callbackDto: MLAuthCallbackDto) {
    try {
      const result = await this.mercadolibreService.handleAuthCallback(
        callbackDto.code,
        callbackDto.state || '',
      );

      return ResponseUtil.success(
        {
          mlUser: {
            id: result.userInfo.id,
            nickname: result.userInfo.nickname,
            email: result.userInfo.email,
            country: result.userInfo.country_id,
            userType: result.userInfo.user_type,
          },
          tokenExpiresAt: result.token.expiresAt,
          scopes: result.token.scopes,
        },
        `¡Conexión exitosa con MercadoLibre! Conectado como ${result.userInfo.nickname}`,
      );
    } catch (error) {
      throw new BadRequestException(
        'Error procesando la autenticación con MercadoLibre: ' + error.message,
      );
    }
  }

  @Get('products')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Obtener productos de MercadoLibre',
    description:
      'Listar todos los productos activos del usuario en MercadoLibre',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Productos de MercadoLibre obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: '15 productos encontrados en MercadoLibre',
        },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'MLA123456789' },
                  title: { type: 'string', example: 'iPhone 13 Pro Max' },
                  price: { type: 'number', example: 999999 },
                  available_quantity: { type: 'number', example: 5 },
                  condition: { type: 'string', example: 'new' },
                  status: { type: 'string', example: 'active' },
                  permalink: {
                    type: 'string',
                    example: 'https://articulo.mercadolibre.com.ar/...',
                  },
                },
              },
            },
            totalProducts: { type: 'number', example: 15 },
            totalValue: { type: 'number', example: 14999985 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No hay conexión activa con MercadoLibre',
  })
  async getMLProducts(@CurrentUser() user: User) {
    const products = await this.mercadolibreService.getUserProducts(user.id);

    const totalValue = products.reduce(
      (sum, product) => sum + product.price * product.available_quantity,
      0,
    );

    const productSummary = products.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      available_quantity: product.available_quantity,
      condition: product.condition,
      status: product.status,
      permalink: product.permalink,
      thumbnail: product.thumbnail,
      category_id: product.category_id,
    }));

    return ResponseUtil.success(
      {
        products: productSummary,
        totalProducts: products.length,
        totalValue,
      },
      `${products.length} productos encontrados en MercadoLibre`,
    );
  }

  @Post('sync')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Sincronizar productos con MercadoLibre',
    description:
      'Sincronizar productos locales con MercadoLibre (crear nuevos o actualizar existentes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sincronización completada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Sincronización completada: 8/10 productos sincronizados exitosamente',
        },
        data: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Producto creado exitosamente',
                  },
                  localProductId: { type: 'string', example: 'product-123' },
                  mlProductId: { type: 'string', example: 'MLA123456789' },
                  action: {
                    type: 'string',
                    example: 'created',
                    enum: ['created', 'updated', 'synced', 'error'],
                  },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 10 },
                successful: { type: 'number', example: 8 },
                errors: { type: 'number', example: 2 },
                created: { type: 'number', example: 3 },
                updated: { type: 'number', example: 5 },
              },
            },
          },
        },
      },
    },
  })
  async syncProducts(
    @Body() syncDto: MLSyncProductsDto,
    @CurrentUser() user: User,
  ) {
    const results = await this.mercadolibreService.syncProductsToML(
      user.id,
      syncDto.productIds,
      syncDto.forceSync,
    );

    // Generar resumen
    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      errors: results.filter((r) => !r.success).length,
      created: results.filter((r) => r.action === 'created').length,
      updated: results.filter((r) => r.action === 'updated').length,
    };

    const message = `Sincronización completada: ${summary.successful}/${summary.total} productos sincronizados exitosamente`;

    return ResponseUtil.success({ results, summary }, message);
  }

  @Get('stats')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Estadísticas de MercadoLibre',
    description:
      'Información de conexión y estadísticas de productos en MercadoLibre',
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
            connected: { type: 'boolean', example: true },
            mlUserId: { type: 'string', example: '123456789' },
            tokenExpiresAt: {
              type: 'string',
              example: '2024-01-02T12:00:00.000Z',
            },
            totalProducts: { type: 'number', example: 25 },
            activeProducts: { type: 'number', example: 20 },
            pausedProducts: { type: 'number', example: 5 },
            lastSync: { type: 'string', example: '2024-01-01T10:30:00.000Z' },
          },
        },
      },
    },
  })
  async getMLStats(@CurrentUser() user: User) {
    const stats = await this.mercadolibreService.getMLStats(user.id);

    return ResponseUtil.success(
      stats,
      stats.connected
        ? 'Estadísticas de MercadoLibre obtenidas exitosamente'
        : 'No hay conexión activa con MercadoLibre',
    );
  }

  @Post('refresh-token')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Renovar token de MercadoLibre',
    description: 'Forzar la renovación del token de acceso de MercadoLibre',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token renovado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Error renovando el token',
  })
  async refreshToken(@CurrentUser() user: User) {
    try {
      const token = await this.mercadolibreService.getActiveToken(user.id);
      const refreshedToken = await this.mercadolibreService.refreshToken(
        token.id,
      );

      return ResponseUtil.success(
        {
          expiresAt: refreshedToken.expiresAt,
          lastRefreshAt: refreshedToken.lastRefreshAt,
        },
        'Token de MercadoLibre renovado exitosamente',
      );
    } catch (error) {
      throw new BadRequestException('Error renovando token: ' + error.message);
    }
  }

  @Delete('disconnect')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @ApiOperation({
    summary: 'Desconectar de MercadoLibre',
    description: 'Desactivar la conexión con MercadoLibre y revocar tokens',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Desconexión exitosa de MercadoLibre',
  })
  async disconnect(@CurrentUser() user: User) {
    await this.mercadolibreService.disconnectML(user.id);

    return ResponseUtil.success(
      null,
      'Desconectado exitosamente de MercadoLibre. Puedes reconectar en cualquier momento.',
    );
  }

  // Endpoint público para webhook de MercadoLibre (futuro)
  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook de MercadoLibre',
    description:
      'Recibir notificaciones de cambios desde MercadoLibre (uso interno)',
  })
  async handleWebhook(@Body() webhookData: any) {
    // TODO: Implementar manejo de webhooks
    console.log('📥 Webhook recibido de MercadoLibre:', webhookData);

    return ResponseUtil.success({ received: true }, 'Webhook procesado');
  }
}
