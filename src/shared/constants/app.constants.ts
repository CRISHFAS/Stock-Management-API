export const APP_CONSTANTS = {
  // JWT
  JWT_SECRET_KEY: 'JWT_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',

  // MercadoLibre
  ML_CLIENT_ID: 'ML_CLIENT_ID',
  ML_CLIENT_SECRET: 'ML_CLIENT_SECRET',
  ML_REDIRECT_URI: 'ML_REDIRECT_URI',
  ML_AUTH_URL: 'https://auth.mercadolibre.com.ar/authorization',
  ML_API_URL: 'https://api.mercadolibre.com',
  ML_TOKEN_URL: 'https://api.mercadolibre.com/oauth/token',

  // App
  DEFAULT_MIN_STOCK: 10,
  MAX_PRODUCTS_PER_USER: 1000,

  // Roles
  ROLES_KEY: 'roles',

  // Headers
  USER_HEADER: 'user',
} as const;

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 10000,
    maxProducts: 100,
    features: ['Stock básico', 'Alertas de stock bajo'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 20000,
    maxProducts: 500,
    features: ['Stock avanzado', 'Integración ML', 'Reportes'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 30000,
    maxProducts: -1, // Ilimitado
    features: ['Todo incluido', 'API acceso', 'Soporte premium'],
  },
} as const;
