import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeliModule } from './meli/meli.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AccountsModule } from './accounts/accounts.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [MeliModule, AccountsModule, SyncModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
