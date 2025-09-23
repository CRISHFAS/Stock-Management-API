import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../../shared/interfaces/product.interface';

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  id: string;

  @ApiProperty({ example: 'LAPTOP-HP-001' })
  sku: string;

  @ApiProperty({ example: 'Laptop HP Pavilion 15-inch' })
  name: string;

  @ApiProperty({ example: 'Laptop HP con características premium' })
  description?: string;

  @ApiProperty({ example: 599.99 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 10 })
  minStock: number;

  @ApiProperty({ example: ProductStatus.ACTIVE, enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ example: false })
  syncWithML: boolean;

  @ApiProperty({ example: 'ML123456789' })
  mercadoLibreId?: string;

  @ApiProperty({ example: false })
  isLowStock: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
