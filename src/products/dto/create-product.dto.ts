import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'LAPTOP-HP-001',
    description: 'SKU único del producto (3-20 caracteres alfanuméricos)',
    minLength: 3,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  @IsString({ message: 'El SKU debe ser una cadena de texto' })
  @MinLength(3, { message: 'El SKU debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El SKU no puede tener más de 20 caracteres' })
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message:
      'El SKU solo puede contener letras, números, guiones y guiones bajos',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  sku: string;

  @ApiProperty({
    example: 'Laptop HP Pavilion 15-inch',
    description: 'Nombre del producto',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    example:
      'Laptop HP Pavilion con procesador Intel Core i5, 8GB RAM, 256GB SSD',
    description: 'Descripción detallada del producto',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(500, {
    message: 'La descripción no puede tener más de 500 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    example: 599.99,
    description: 'Precio del producto en pesos',
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  @Max(999999.99, { message: 'El precio no puede ser mayor a 999,999.99' })
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Cantidad inicial en stock',
    minimum: 0,
  })
  @IsNumber({}, { message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Transform(({ value }) => parseInt(value))
  stock: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Stock mínimo para alerta (por defecto: 10)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  minStock?: number = 10;
}
