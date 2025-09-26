import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix para todas las rutas
  app.setGlobalPrefix('api');

  // CORS habilitado para desarrollo
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validación global con pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Stock Management API')
    .setDescription(
      `
      ## API completa para gestión de stock con integración a MercadoLibre
      
      ### Características:
      - 🔐 **Autenticación JWT** completa
      - 📦 **Gestión de productos** y stock
      - 🛒 **Integración MercadoLibre** con OAuth2
      - 📊 **Seguimiento de movimientos** de stock
      - ⚡ **Sincronización automática** con ML
      
      ### Uso:
      1. Registrarte o hacer login para obtener token JWT
      2. Usar el token en el header Authorization: Bearer {token}
      3. Conectar con MercadoLibre para sincronización
      
      ### Roles:
      - **USER**: Gestión básica de productos
      - **ADMIN**: Acceso completo al sistema
    `,
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Autenticación y gestión de usuarios')
    .addTag('Products', 'Gestión de productos y stock')
    .addTag('Stock', 'Movimientos y ajustes de stock')
    .addTag('MercadoLibre', 'Integración con MercadoLibre')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Desarrollo Local')
    .setContact(
      'Equipo de Desarrollo',
      'https://github.com/CRISHFAS/Stock-Management-API',
      'dev@tuempresa.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Stock Management API',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = configService.get('PORT', 3000);

  await app.listen(port);

  console.log(`
  🚀 Aplicación iniciada exitosamente!
  
  📍 URL Principal: http://localhost:${port}
  📚 Documentación Swagger: http://localhost:${port}/api/docs
  🔧 Entorno: ${configService.get('NODE_ENV', 'development')}
  
  📋 Endpoints disponibles:
  • GET  /api - Health check
  • POST /api/auth/register - Registro de usuario
  • POST /api/auth/login - Login
  • GET  /api/auth/profile - Perfil usuario
  `);
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar la aplicación:', err);
  process.exit(1);
});
