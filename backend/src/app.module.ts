import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeliModule } from './meli/meli.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AccountsModule } from './accounts/accounts.module';
import { SyncModule } from './sync/sync.module';
import { ItemsModule } from './items/items.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { QuestionsModule } from './questions/questions.module';
import { QueueModule } from './queue/queue.module';
import { WorkersModule } from './workers/workers.module';
import { SettingsModule } from './settings/settings.module';
import { BillingModule } from './billing/billing.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExtraRevenuesModule } from './extra-revenues/extra-revenues.module';
import { TaxesModule } from './taxes/taxes.module';

@Module({
  imports: [
    MeliModule,
    AccountsModule,
    SyncModule,
    ItemsModule,
    OrdersModule,
    ShipmentsModule,
    QuestionsModule,
    QueueModule,
    WorkersModule,
    SettingsModule,
    BillingModule,
    ExpensesModule,
    ExtraRevenuesModule,
    TaxesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
