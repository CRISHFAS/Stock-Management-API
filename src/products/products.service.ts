import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Product, ProductStatus } from '../shared/interfaces/product.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ValidationUtil } from '../shared/utils/validation.util';
import {
  ProductNotFoundException,
  InvalidSKUException,
} from '../shared/exceptions/business.exception';

export interface ProductsListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    // Productos demo
    {
      id: 'product-demo-001',
      sku: 'LAPTOP-DEMO-001',
      name: 'Laptop Demo HP Pavilion',
      description: 'Laptop de demostración con excelentes características',
      price: 599.99,
      stock: 15,
      minStock: 10,
      status: ProductStatus.ACTIVE,
      userId: 'user-demo-001',
      syncWithML: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'product-demo-002',
      sku: 'MOUSE-DEMO-002',
      name: 'Mouse Inalámbrico Demo',
      description: 'Mouse ergonómico inalámbrico de alta precisión',
      price: 29.99,
      stock: 5,
      minStock: 15,
      status: ProductStatus.ACTIVE,
      userId: 'user-demo-001',
      syncWithML: false,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    // Validar SKU único
    const existingSku = this.products.find(
      (p) => p.sku.toUpperCase() === createProductDto.sku.toUpperCase(),
    );

    if (existingSku) {
      throw new InvalidSKUException(createProductDto.sku);
    }

    // Validaciones adicionales
    if (!ValidationUtil.isValidSKU(createProductDto.sku)) {
      throw new InvalidSKUException(createProductDto.sku);
    }

    if (!ValidationUtil.isValidPrice(createProductDto.price)) {
      throw new ConflictException('Precio inválido');
    }

    // Crear producto - FIX: asegurar que minStock siempre tenga valor
    const newProduct: Product = {
      id: uuid(),
      sku: createProductDto.sku.toUpperCase(),
      name: ValidationUtil.sanitizeString(createProductDto.name),
      description: createProductDto.description
        ? ValidationUtil.sanitizeString(createProductDto.description)
        : undefined,
      price: createProductDto.price,
      stock: createProductDto.stock,
      minStock: createProductDto.minStock || 10, // FIX: valor por defecto
      status: ProductStatus.ACTIVE,
      userId,
      syncWithML: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.push(newProduct);
    return newProduct;
  }

  async findAll(
    query: ProductsQueryDto,
    userId: string,
  ): Promise<ProductsListResponse> {
    // FIX: Asegurar valores por defecto
    const page = query.page || 1;
    const limit = query.limit || 10;

    let filteredProducts = this.products.filter((p) => p.userId === userId);

    // Aplicar filtros
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower),
      );
    }

    if (query.status) {
      filteredProducts = filteredProducts.filter(
        (p) => p.status === query.status,
      );
    }

    if (query.lowStock) {
      filteredProducts = filteredProducts.filter((p) => p.stock <= p.minStock);
    }

    // Ordenamiento
    filteredProducts.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (query.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'sku':
          aVal = a.sku;
          bVal = b.sku;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }

      if (query.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginación - FIX: usar variables con valores seguros
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // FIX: return correcto
    return {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string, userId: string): Promise<Product> {
    const product = this.products.find((p) => p.id === id);

    if (!product) {
      throw new ProductNotFoundException(id);
    }

    if (product.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const productIndex = this.products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      throw new ProductNotFoundException(id);
    }

    const product = this.products[productIndex];

    if (product.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    // Validar precio si se está actualizando
    if (
      updateProductDto.price !== undefined &&
      !ValidationUtil.isValidPrice(updateProductDto.price)
    ) {
      throw new ConflictException('Precio inválido');
    }

    // Sanitizar strings si están presentes
    const updates: Partial<Product> = {
      ...updateProductDto,
      updatedAt: new Date(),
    };

    if (updateProductDto.name) {
      updates.name = ValidationUtil.sanitizeString(updateProductDto.name);
    }

    if (updateProductDto.description) {
      updates.description = ValidationUtil.sanitizeString(
        updateProductDto.description,
      );
    }

    // Actualizar producto
    this.products[productIndex] = { ...product, ...updates };

    return this.products[productIndex];
  }

  async remove(id: string, userId: string): Promise<void> {
    const productIndex = this.products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      throw new ProductNotFoundException(id);
    }

    const product = this.products[productIndex];

    if (product.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este producto');
    }

    this.products.splice(productIndex, 1);
  }

  // Métodos de utilidad
  async getLowStockProducts(userId: string): Promise<Product[]> {
    return this.products.filter(
      (p) => p.userId === userId && p.stock <= p.minStock,
    );
  }

  async getProductsBySKU(sku: string, userId: string): Promise<Product | null> {
    return (
      this.products.find(
        (p) => p.userId === userId && p.sku.toUpperCase() === sku.toUpperCase(),
      ) || null
    );
  }

  async getUserProductsCount(userId: string): Promise<number> {
    return this.products.filter((p) => p.userId === userId).length;
  }

  async getUserProductsStats(userId: string) {
    const userProducts = this.products.filter((p) => p.userId === userId);
    const lowStockCount = userProducts.filter(
      (p) => p.stock <= p.minStock,
    ).length;
    const totalValue = userProducts.reduce(
      (sum, p) => sum + p.price * p.stock,
      0,
    );

    return {
      total: userProducts.length,
      active: userProducts.filter((p) => p.status === ProductStatus.ACTIVE)
        .length,
      inactive: userProducts.filter((p) => p.status === ProductStatus.INACTIVE)
        .length,
      discontinued: userProducts.filter(
        (p) => p.status === ProductStatus.DISCONTINUED,
      ).length,
      lowStock: lowStockCount,
      totalInventoryValue: totalValue,
    };
  }

  // FIX: Método para admin - sin filtro de userId
  async findAllAdmin(query: ProductsQueryDto): Promise<ProductsListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    let filteredProducts = [...this.products]; // Todos los productos

    // Aplicar filtros (misma lógica pero sin filtro de usuario)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower),
      );
    }

    if (query.status) {
      filteredProducts = filteredProducts.filter(
        (p) => p.status === query.status,
      );
    }

    if (query.lowStock) {
      filteredProducts = filteredProducts.filter((p) => p.stock <= p.minStock);
    }

    // Ordenamiento (mismo código)
    filteredProducts.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (query.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'sku':
          aVal = a.sku;
          bVal = b.sku;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }

      if (query.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginación
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    return {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
