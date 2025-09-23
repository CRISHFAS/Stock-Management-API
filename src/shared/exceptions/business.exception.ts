import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode);
  }
}

export class ProductNotFoundException extends BusinessException {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidSKUException extends BusinessException {
  constructor(sku: string) {
    super(`SKU '${sku}' is invalid or already exists`, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientStockException extends BusinessException {
  constructor(available: number, requested: number) {
    super(
      `Insufficient stock. Available: ${available}, Requested: ${requested}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MLAuthenticationException extends BusinessException {
  constructor(message: string = 'MercadoLibre authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
