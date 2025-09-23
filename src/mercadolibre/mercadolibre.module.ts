import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MercadolibreService } from './mercadolibre.service';
import { MercadolibreController } from './mercadolibre.controller';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ProductsModule,
    SubscriptionsModule,
  ],
  controllers: [MercadolibreController],
  providers: [MercadolibreService],
  exports: [MercadolibreService],
})
export class MercadolibreModule {}
