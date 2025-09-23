import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProductStatus } from '../../shared/interfaces/product.interface';

export class ProductsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Número de página',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Cantidad de items por página (máximo 50)',
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'laptop',
    description: 'Buscar en nombre o SKU',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    example: ProductStatus.ACTIVE,
    description: 'Filtrar por estado',
    enum: ProductStatus,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estado inválido' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Mostrar solo productos con stock bajo',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  lowStock?: boolean;

  @ApiPropertyOptional({
    example: 'name',
    description: 'Ordenar por campo',
    enum: ['name', 'sku', 'price', 'stock', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'sku' | 'price' | 'stock' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
