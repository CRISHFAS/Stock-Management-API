import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry, Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosResponse } from 'axios';
import { v4 as uuid } from 'uuid';

import {
  MercadoLibreToken,
  MLAuthResponse,
  MLUserInfo,
  MLProduct,
  MLItemUpdate,
  MLSyncResult,
} from '../shared/interfaces/ml-token.interface';
import { Product } from '../shared/interfaces/product.interface';
import { User } from '../shared/interfaces/user.interface';
import { ProductsService } from '../products/products.service';
import { APP_CONSTANTS } from '../shared/constants/app.constants';

@Injectable()
export class MercadolibreService {
  private mlTokens: MercadoLibreToken[] = [
    // Token demo (expirado para testing)
    {
      id: 'ml-token-demo-001',
      userId: 'user-demo-001',
      mlUserId: '123456789',
      accessToken: 'APP_USR-expired-token-for-demo',
      refreshToken: 'TG-refresh-token-demo',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expirado hace 1 hora
      isActive: true,
      scopes: ['read', 'write'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  private readonly ML_API_BASE = 'https://api.mercadolibre.com';
  private readonly ML_AUTH_BASE = 'https://auth.mercadolibre.com.ar';

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService,
    private schedulerRegistry: SchedulerRegistry, // Comentar temporalmente
  ) {}

  // 1. AUTENTICACIÓN OAUTH2
  generateAuthUrl(userId: string): { authUrl: string; state: string } {
    const clientId = this.configService.get('ML_CLIENT_ID');
    const redirectUri = this.configService.get('ML_REDIRECT_URI');
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const authUrl =
      `${this.ML_AUTH_BASE}/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    return { authUrl, state };
  }

  async handleAuthCallback(
    code: string,
    state: string,
  ): Promise<{
    token: MercadoLibreToken;
    userInfo: MLUserInfo;
  }> {
    try {
      // 1. Intercambiar código por token
      const tokenResponse = await this.exchangeCodeForToken(code);

      // 2. Obtener información del usuario
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // 3. Extraer userId del state
      const userId = state.split('_')[0];

      // 4. Crear o actualizar token
      const token = await this.saveOrUpdateToken(
        userId,
        tokenResponse,
        userInfo,
      );

      return { token, userInfo };
    } catch (error) {
      console.error('Error in auth callback:', error);
      throw new BadRequestException(
        'Error procesando autenticación de MercadoLibre',
      );
    }
  }

  private async exchangeCodeForToken(code: string): Promise<MLAuthResponse> {
    const clientId = this.configService.get('ML_CLIENT_ID');
    const clientSecret = this.configService.get('ML_CLIENT_SECRET');
    const redirectUri = this.configService.get('ML_REDIRECT_URI');

    const response: AxiosResponse<MLAuthResponse> = await axios.post(
      `${this.ML_API_BASE}/oauth/token`,
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
    );

    return response.data;
  }

  private async getUserInfo(accessToken: string): Promise<MLUserInfo> {
    const response: AxiosResponse<MLUserInfo> = await axios.get(
      `${this.ML_API_BASE}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  }

  private async saveOrUpdateToken(
    userId: string,
    authResponse: MLAuthResponse,
    userInfo: MLUserInfo,
  ): Promise<MercadoLibreToken> {
    const existingTokenIndex = this.mlTokens.findIndex(
      (t) => t.userId === userId,
    );
    const expiresAt = new Date(Date.now() + authResponse.expires_in * 1000);

    const tokenData: MercadoLibreToken = {
      id:
        existingTokenIndex >= 0 ? this.mlTokens[existingTokenIndex].id : uuid(),
      userId,
      mlUserId: userInfo.id.toString(),
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt,
      isActive: true,
      scopes: authResponse.scope?.split(' ') || [],
      createdAt:
        existingTokenIndex >= 0
          ? this.mlTokens[existingTokenIndex].createdAt
          : new Date(),
      updatedAt: new Date(),
      lastRefreshAt: new Date(),
    };

    if (existingTokenIndex >= 0) {
      this.mlTokens[existingTokenIndex] = tokenData;
    } else {
      this.mlTokens.push(tokenData);
    }

    return tokenData;
  }

  // 2. REFRESH TOKEN AUTOMÁTICO
  @Cron(CronExpression.EVERY_HOUR)
  async refreshExpiredTokens(): Promise<void> {
    console.log('🔄 Ejecutando refresh automático de tokens ML...');

    const tokensToRefresh = this.mlTokens.filter(
      (token) => token.isActive && this.needsRefresh(token),
    );

    console.log(`📋 Tokens que necesitan refresh: ${tokensToRefresh.length}`);

    for (const token of tokensToRefresh) {
      try {
        await this.refreshToken(token.id);
        console.log(`✅ Token refreshed para usuario ${token.userId}`);
      } catch (error) {
        console.error(
          `❌ Error refreshing token para usuario ${token.userId}:`,
          error.message,
        );
      }
    }
  }

  async refreshToken(tokenId: string): Promise<MercadoLibreToken> {
    const tokenIndex = this.mlTokens.findIndex((t) => t.id === tokenId);

    if (tokenIndex === -1) {
      throw new NotFoundException('Token no encontrado');
    }

    const token = this.mlTokens[tokenIndex];

    try {
      const clientId = this.configService.get('ML_CLIENT_ID');
      const clientSecret = this.configService.get('ML_CLIENT_SECRET');

      const response: AxiosResponse<MLAuthResponse> = await axios.post(
        `${this.ML_API_BASE}/oauth/token`,
        {
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: token.refreshToken,
        },
      );

      const refreshedToken: MercadoLibreToken = {
        ...token,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || token.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        updatedAt: new Date(),
        lastRefreshAt: new Date(),
      };

      this.mlTokens[tokenIndex] = refreshedToken;
      return refreshedToken;
    } catch (error) {
      console.error('Error refreshing ML token:', error);

      // Marcar token como inactivo si el refresh falla
      this.mlTokens[tokenIndex].isActive = false;
      this.mlTokens[tokenIndex].updatedAt = new Date();

      throw new UnauthorizedException(
        'No se pudo renovar el token de MercadoLibre',
      );
    }
  }

  private needsRefresh(token: MercadoLibreToken): boolean {
    const now = new Date();
    const refreshThreshold = new Date(
      token.expiresAt.getTime() - 60 * 60 * 1000,
    ); // 1 hora antes
    return now >= refreshThreshold;
  }

  // 3. GESTIÓN DE PRODUCTOS ML
  async getUserProducts(userId: string): Promise<MLProduct[]> {
    const token = await this.getActiveToken(userId);

    try {
      // Obtener lista de IDs de productos del usuario
      const itemsResponse = await axios.get(
        `${this.ML_API_BASE}/users/${token.mlUserId}/items/search?status=active`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        },
      );

      const itemIds = itemsResponse.data.results;

      if (!itemIds.length) {
        return [];
      }

      // Obtener detalles de todos los productos
      const itemsDetails: MLProduct[] = [];

      // Procesar en lotes de 20 (límite de ML)
      for (let i = 0; i < itemIds.length; i += 20) {
        const batch = itemIds.slice(i, i + 20);
        const detailsResponse = await axios.get(
          `${this.ML_API_BASE}/items?ids=${batch.join(',')}`,
          {
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
            },
          },
        );

        const batchDetails = detailsResponse.data
          .filter((item: any) => item.code === 200)
          .map((item: any) => item.body);

        itemsDetails.push(...batchDetails);
      }

      return itemsDetails;
    } catch (error) {
      console.error('Error fetching ML products:', error);
      throw new BadRequestException(
        'Error obteniendo productos de MercadoLibre',
      );
    }
  }

  async syncProductsToML(
    userId: string,
    productIds?: string[],
    forceSync = false,
  ): Promise<MLSyncResult[]> {
    const token = await this.getActiveToken(userId);
    const results: MLSyncResult[] = [];

    // Obtener productos a sincronizar
    let productsToSync: Product[];

    if (productIds && productIds.length > 0) {
      // Sincronizar productos específicos
      productsToSync = [];
      for (const productId of productIds) {
        try {
          const product = await this.productsService.findOne(productId, userId);
          productsToSync.push(product);
        } catch (error) {
          results.push({
            success: false,
            message: 'Producto no encontrado',
            localProductId: productId,
            action: 'error',
            error: error.message,
          });
        }
      }
    } else {
      // Sincronizar todos los productos marcados para ML
      const allProducts = await this.productsService.findAll(
        { page: 1, limit: 1000 },
        userId,
      );
      productsToSync = allProducts.products.filter((p) => p.syncWithML);
    }

    console.log(
      `📤 Sincronizando ${productsToSync.length} productos con MercadoLibre...`,
    );

    for (const product of productsToSync) {
      try {
        let result: MLSyncResult;

        if (product.mercadoLibreId) {
          // Actualizar producto existente
          result = await this.updateMLProduct(token, product);
        } else {
          // Crear nuevo producto
          result = await this.createMLProduct(token, product);
        }

        // Actualizar el producto local con el ID de ML si es necesario
        if (result.success && result.mlProductId && !product.mercadoLibreId) {
          await this.productsService.update(
            product.id,
            {
              mercadoLibreId: result.mlProductId,
            },
            userId,
          );
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: 'Error sincronizando producto',
          localProductId: product.id,
          action: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async createMLProduct(
    token: MercadoLibreToken,
    product: Product,
  ): Promise<MLSyncResult> {
    try {
      const mlItem = this.buildMLItem(product);

      const response = await axios.post(`${this.ML_API_BASE}/items`, mlItem, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        message: 'Producto creado exitosamente en MercadoLibre',
        localProductId: product.id,
        mlProductId: response.data.id,
        action: 'created',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creando producto en MercadoLibre',
        localProductId: product.id,
        action: 'error',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async updateMLProduct(
    token: MercadoLibreToken,
    product: Product,
  ): Promise<MLSyncResult> {
    try {
      const updates: MLItemUpdate = {
        title: product.name,
        price: product.price,
        available_quantity: product.stock,
      };

      const response = await axios.put(
        `${this.ML_API_BASE}/items/${product.mercadoLibreId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        message: 'Producto actualizado exitosamente en MercadoLibre',
        localProductId: product.id,
        mlProductId: product.mercadoLibreId!,
        action: 'updated',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error actualizando producto en MercadoLibre',
        localProductId: product.id,
        action: 'error',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private buildMLItem(product: Product): any {
    return {
      title: product.name,
      category_id: 'MLA1051', // Categoría por defecto - Electrónicos
      price: product.price,
      currency_id: 'ARS',
      available_quantity: product.stock,
      buying_mode: 'buy_it_now',
      listing_type_id: 'bronze', // Tipo de publicación básica
      condition: 'new',
      description: {
        plain_text:
          product.description || `${product.name} - Disponible en stock`,
      },
      pictures: [
        {
          source:
            'https://via.placeholder.com/500x500?text=' +
            encodeURIComponent(product.name),
        },
      ],
      attributes: [
        {
          id: 'BRAND',
          value_name: 'Genérico',
        },
        {
          id: 'MODEL',
          value_name: product.sku,
        },
      ],
      tags: ['immediate_payment'],
    };
  }

  // 4. UTILIDADES
  async getActiveToken(userId: string): Promise<MercadoLibreToken> {
    const token = this.mlTokens.find((t) => t.userId === userId && t.isActive);

    if (!token) {
      throw new UnauthorizedException(
        'No tienes una conexión activa con MercadoLibre',
      );
    }

    // Auto-refresh si es necesario
    if (this.needsRefresh(token)) {
      return await this.refreshToken(token.id);
    }

    return token;
  }

  async disconnectML(userId: string): Promise<void> {
    const tokenIndex = this.mlTokens.findIndex((t) => t.userId === userId);

    if (tokenIndex >= 0) {
      this.mlTokens[tokenIndex].isActive = false;
      this.mlTokens[tokenIndex].updatedAt = new Date();
    }
  }

  async getMLStats(userId: string) {
    try {
      const token = await this.getActiveToken(userId);
      const products = await this.getUserProducts(userId);

      const stats = {
        connected: true,
        mlUserId: token.mlUserId,
        tokenExpiresAt: token.expiresAt,
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.status === 'active').length,
        pausedProducts: products.filter((p) => p.status === 'paused').length,
        lastSync: token.lastRefreshAt,
      };

      return stats;
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}
