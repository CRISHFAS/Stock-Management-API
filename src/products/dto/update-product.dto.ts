import {
  IsOptional,
  IsNumber,
  IsString,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProductStatus } from '../../shared/interfaces/product.interface';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Laptop HP Pavilion 15-inch Actualizada',
    description: 'Nuevo nombre del producto',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    example: 'Descripción actualizada del producto',
    description: 'Nueva descripción del producto',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(500, {
    message: 'La descripción no puede tener más de 500 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    example: 649.99,
    description: 'Nuevo precio del producto',
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  @Max(999999.99, { message: 'El precio no puede ser mayor a 999,999.99' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  price?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'Nuevo stock del producto',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  stock?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Nuevo stock mínimo para alertas',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  minStock?: number;

  @ApiPropertyOptional({
    example: ProductStatus.ACTIVE,
    description: 'Estado del producto',
    enum: ProductStatus,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estado inválido' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Activar/desactivar sincronización con MercadoLibre',
  })
  @IsOptional()
  syncWithML?: boolean;

  // FIX: Agregar campo mercadoLibreId
  @ApiPropertyOptional({
    example: 'MLA123456789',
    description: 'ID del producto en MercadoLibre (solo para uso interno)',
  })
  @IsOptional()
  @IsString()
  mercadoLibreId?: string;
}
