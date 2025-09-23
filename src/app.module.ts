import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos de la aplicación
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MercadolibreModule } from './mercadolibre/mercadolibre.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    ScheduleModule.forRoot(), // Para los cron jobs
    AuthModule,
    ProductsModule,
    SubscriptionsModule,
    MercadolibreModule, // ✅ AGREGADO
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
