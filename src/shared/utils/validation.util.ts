export class ValidationUtil {
  static isValidSKU(sku: string): boolean {
    // SKU debe ser alfanumérico, entre 3-20 caracteres
    const skuRegex = /^[A-Za-z0-9-_]{3,20}$/;
    return skuRegex.test(sku);
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0;
  }

  static isValidPrice(price: number): boolean {
    return this.isPositiveNumber(price) && price <= 999999.99;
  }

  static sanitizeString(str: string): string {
    return str?.trim().replace(/\s+/g, ' ') || '';
  }
}
