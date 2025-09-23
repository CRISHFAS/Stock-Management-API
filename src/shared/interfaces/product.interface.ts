export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  userId: string;
  mercadoLibreId?: string;
  syncWithML: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  status?: ProductStatus;
  syncWithML?: boolean;
}

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  syncWithML: boolean;
  mercadoLibreId?: string;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}
