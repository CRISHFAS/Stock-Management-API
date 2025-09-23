export enum MovementType {
  IN = 'in', // Entrada de stock
  OUT = 'out', // Salida de stock
  ADJUSTMENT = 'adjustment', // Ajuste manual
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  userId: string;
  createdAt: Date;
}

export interface CreateStockMovementRequest {
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
}
