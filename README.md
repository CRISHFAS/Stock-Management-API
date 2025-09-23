# 📦 Stock Management API - Documentación Completa

## 🎯 Descripción General

**Stock Management API** es una aplicación SaaS completa desarrollada con NestJS que permite a empresas y vendedores gestionar su inventario de manera profesional con integración directa a MercadoLibre.

### ✨ Características Principales

- 🔐 **Sistema de autenticación JWT** con roles de usuario
- 📦 **Gestión completa de productos** con seguimiento de stock
- 💳 **Sistema de suscripciones** con 3 planes de pago
- 🛒 **Integración OAuth2 con MercadoLibre** para sincronización automática
- 📊 **Estadísticas y reportes** avanzados
- 🔄 **Refresh automático de tokens** cada hora
- 📚 **Documentación Swagger** interactiva
- ⚡ **Alertas de stock bajo** automáticas

---

## 🏗️ Arquitectura del Sistema

### Tecnologías Utilizadas

- **Framework:** NestJS (Node.js)
- **Lenguaje:** TypeScript
- **Documentación:** Swagger/OpenAPI 3.0
- **Autenticación:** JWT + Passport
- **Validación:** Class-validator
- **Tareas programadas:** @nestjs/schedule
- **HTTP Client:** Axios

### Estructura de Módulos

```
📁 Stock Management API
├── 🔐 Auth Module           # Autenticación y autorización
├── 📦 Products Module       # Gestión de productos y stock
├── 💳 Subscriptions Module  # Planes y pagos
├── 🛒 MercadoLibre Module   # Integración OAuth2 y sync
└── 🏥 Health Module         # Monitoreo del sistema
```

---

## 🚀 Guía de Implementación

### 1. Prerrequisitos

```bash
# Versiones requeridas
Node.js: >= 16.0.0
npm: >= 8.0.0
```

### 2. Instalación

```bash
# Clonar proyecto
git clone git@github.com:CRISHFAS/Stock-Management-API.git
cd Stock-Management-API

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configuración de Variables de Entorno

```env
# .env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# MercadoLibre Configuration
ML_CLIENT_ID=your-ml-client-id-from-developers-ml
ML_CLIENT_SECRET=your-ml-client-secret-from-developers-ml
ML_REDIRECT_URI=http://localhost:3000/api/mercadolibre/callback

# Payment Providers (Opcional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
MP_ACCESS_TOKEN=your_mercadopago_access_token

# Application
PORT=3000
NODE_ENV=development
```

### 4. Configuración de MercadoLibre Developers

1. **Ir a:** https://developers.mercadolibre.com.ar/
2. **Crear aplicación** nueva
3. **Configurar Redirect URI:** `http://localhost:3000/api/mercadolibre/callback`
4. **Copiar Client ID y Secret** al archivo .env
5. **Solicitar permisos:** `read`, `write`

### 5. Ejecutar la aplicación

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

---

## 📚 Guía de Uso

### 1. Acceso a la Documentación

Una vez iniciada la aplicación, accede a:

- **API:** http://localhost:3000/api
- **Swagger UI:** http://localhost:3000/api/docs

### 2. Flujo de Autenticación

#### Registro de Usuario

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "MiPassword123!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "MiPassword123!"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-user",
      "email": "usuario@empresa.com",
      "role": "user"
    },
    "expiresAt": "2024-01-02T12:00:00.000Z"
  }
}
```

#### Uso del Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Gestión de Productos

#### Crear Producto

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "LAPTOP-HP-001",
  "name": "Laptop HP Pavilion 15-inch",
  "description": "Laptop con Intel Core i5, 8GB RAM",
  "price": 599.99,
  "stock": 50,
  "minStock": 10
}
```

#### Listar Productos

```http
GET /api/products?page=1&limit=10&search=laptop&lowStock=false
Authorization: Bearer <token>
```

#### Estadísticas de Inventario

```http
GET /api/products/stats
Authorization: Bearer <token>
```

### 4. Sistema de Suscripciones

#### Ver Planes Disponibles

```http
GET /api/subscriptions/plans
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "plan": "basic",
      "name": "Plan Básico",
      "price": 10000,
      "currency": "ARS",
      "maxProducts": 100,
      "features": ["Stock básico", "Alertas", "Soporte email"]
    },
    {
      "plan": "premium",
      "name": "Plan Premium",
      "price": 20000,
      "currency": "ARS",
      "maxProducts": 500,
      "features": ["Todo lo básico", "Integración ML", "Reportes avanzados"]
    }
  ]
}
```

#### Crear Suscripción

```http
POST /api/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "paymentProvider": "mercadopago"
}
```

### 5. Integración MercadoLibre

#### Iniciar Conexión OAuth2

```http
GET /api/mercadolibre/auth
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "authUrl": "https://auth.mercadolibre.com.ar/authorization?...",
    "state": "user123_1234567890_abc"
  }
}
```

#### Sincronizar Productos

```http
POST /api/mercadolibre/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "productIds": ["product-id-1", "product-id-2"],
  "forceSync": false
}
```

---

## 🔒 Sistema de Permisos

### Roles de Usuario

| Rol       | Descripción      | Permisos                         |
| --------- | ---------------- | -------------------------------- |
| **user**  | Usuario estándar | Gestión de sus propios productos |
| **admin** | Administrador    | Acceso completo al sistema       |

### Planes de Suscripción

| Plan           | Precio      | Productos | Características                      |
| -------------- | ----------- | --------- | ------------------------------------ |
| **Basic**      | $10.000/mes | 100       | Stock básico, alertas, soporte email |
| **Premium**    | $20.000/mes | 500       | Todo lo básico + ML + reportes       |
| **Enterprise** | $30.000/mes | Ilimitado | Todo + API + soporte 24/7            |

### Restricciones por Plan

- **MercadoLibre:** Requiere Plan Premium o superior
- **Reportes avanzados:** Requiere Plan Premium o superior
- **API completo:** Requiere Plan Enterprise

---

## 🔧 API Reference

### Endpoints Principales

#### 🔐 Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil del usuario
- `GET /api/auth/users` - Listar usuarios (admin)

#### 📦 Productos

- `GET /api/products` - Listar productos con filtros
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener producto por ID
- `PATCH /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/stats` - Estadísticas de inventario
- `GET /api/products/low-stock` - Productos con stock bajo

#### 💳 Suscripciones

- `GET /api/subscriptions/plans` - Ver planes disponibles
- `POST /api/subscriptions` - Crear suscripción
- `GET /api/subscriptions/me` - Mi suscripción actual
- `PATCH /api/subscriptions/upgrade` - Cambiar plan
- `DELETE /api/subscriptions/cancel` - Cancelar suscripción
- `GET /api/subscriptions/admin/stats` - Estadísticas (admin)

#### 🛒 MercadoLibre

- `GET /api/mercadolibre/auth` - Iniciar OAuth2
- `GET /api/mercadolibre/callback` - Callback OAuth2
- `GET /api/mercadolibre/products` - Productos de ML
- `POST /api/mercadolibre/sync` - Sincronizar productos
- `GET /api/mercadolibre/stats` - Estadísticas de conexión
- `DELETE /api/mercadolibre/disconnect` - Desconectar

---

## 📊 Características Avanzadas

### 1. Refresh Automático de Tokens

- **Frecuencia:** Cada hora (@Cron)
- **Lógica:** Renueva tokens 1 hora antes de expirar
- **Resilencia:** Manejo automático de errores

### 2. Sincronización Inteligente

- **Crear:** Productos nuevos se crean en ML
- **Actualizar:** Cambios se sincronizan automáticamente
- **Mapeo:** SKU local ↔ ID MercadoLibre
- **Batch:** Procesa productos en lotes de 20

### 3. Alertas de Stock

- **Trigger:** Stock <= minStock
- **Endpoint:** GET /api/products/low-stock
- **Dashboard:** Integrado en estadísticas

### 4. Validaciones Robustas

- **SKU:** Único por usuario, alfanumérico 3-20 chars
- **Email:** Formato válido, único en el sistema
- **Password:** Min 6 chars, mayúscula + número
- **Precios:** Rango 0.01 - 999,999.99

---

## 🧪 Testing

### Usuarios Demo

El sistema incluye usuarios demo para pruebas:

```javascript
// Admin
email: 'admin@stockmanagement.com';
password: 'Admin123!';

// Usuario Demo
email: 'demo@stockmanagement.com';
password: 'Demo123!';
```

### Datos de Prueba

- **2 productos demo** precargados
- **1 suscripción Premium activa** para el usuario demo
- **Token ML demo** (expirado para testing de refresh)

### Swagger Testing

1. Ir a http://localhost:3000/api/docs
2. Hacer login con usuario demo
3. Usar "Authorize" con el token obtenido
4. Probar todos los endpoints

---

## 📈 Monitoreo y Logs

### Health Checks

- `GET /api` - Health check básico
- `GET /api/health` - Health check detallado

### Logs del Sistema

```bash
# Ejemplo de logs
🔄 Ejecutando refresh automático de tokens ML...
📋 Tokens que necesitan refresh: 2
✅ Token refreshed para usuario user-123
📤 Sincronizando 5 productos con MercadoLibre...
```

---

## 🔮 Roadmap Futuro

### Funcionalidades Planificadas

- [ ] **Base de datos real** (PostgreSQL/MySQL)
- [ ] **Webhooks de MercadoLibre** para sincronización en tiempo real
- [ ] **Reportes PDF** exportables
- [ ] **Multi-tenancy** para empresas
- [ ] **API de terceros** para integraciones
- [ ] **App móvil** React Native
- [ ] **Dashboard analytics** avanzado
- [ ] **Integración con otros marketplaces**

### Mejoras Técnicas

- [ ] **Tests unitarios** y de integración
- [ ] **Docker** containerización
- [ ] **CI/CD** pipeline
- [ ] **Monitoreo** con Prometheus
- [ ] **Cache** con Redis
- [ ] **Rate limiting** avanzado

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

#### 1. Error de conexión ML

```bash
Error: No tienes una conexión activa con MercadoLibre
```

**Solución:** Ejecutar GET /api/mercadolibre/auth y completar OAuth2

#### 2. Token expirado

```bash
Error: Token JWT inválido o expirado
```

**Solución:** Hacer login nuevamente para obtener token fresh

#### 3. Plan insuficiente

```bash
Error: Esta funcionalidad requiere Plan Premium o superior
```

**Solución:** Upgradeaer suscripción via POST /api/subscriptions

### Contacto

- **Documentación:** http://localhost:3000/api/docs
- **Health Status:** http://localhost:3000/api/health
- **Logs:** Ver consola del servidor

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

---

## 🙏 Agradecimientos

Desarrollado con ❤️ usando:

- [NestJS](https://nestjs.com/) - Framework Node.js progresivo
- [MercadoLibre Developers](https://developers.mercadolibre.com.ar/) - API de integración
- [Swagger](https://swagger.io/) - Documentación API

---

**🚀 ¡Listo para gestionar tu inventario como un profesional!**
