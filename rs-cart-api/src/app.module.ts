import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';

import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cartItem.entity';
import { CartService } from './cart';
import { Product } from './entity/product.entity';

@Module({
  imports: [
    // AuthModule,
    CartModule,
    OrderModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER_NAME,
      password: process.env.DB_USER_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Cart, CartItem, Product],
      synchronize: true, // Avoid in prod, can result in data loss
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
