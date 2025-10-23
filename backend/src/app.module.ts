import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeliModule } from './meli/meli.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AccountsModule } from './accounts/accounts.module';
import { SyncModule } from './sync/sync.module';
import { ItemsModule } from './items/items.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [MeliModule, AccountsModule, SyncModule, ItemsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
