import { IsArray, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MLSyncProductsDto {
  @ApiPropertyOptional({
    example: ['product-id-1', 'product-id-2'],
    description:
      'IDs específicos de productos a sincronizar. Si está vacío, sincroniza todos los productos con syncWithML=true',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Forzar sincronización completa incluso si no hay cambios',
  })
  @IsOptional()
  @IsBoolean()
  forceSync?: boolean;
}

export class MLProductStatusDto {
  @ApiPropertyOptional({
    example: 'active',
    description: 'Nuevo estado del producto en MercadoLibre',
    enum: ['active', 'paused', 'closed'],
  })
  @IsOptional()
  @IsString()
  status?: 'active' | 'paused' | 'closed';
}
