import { Module } from '@nestjs/common';
import { MeliController } from './meli.controller';
import { MeliService } from './meli.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountsModule } from '../accounts/accounts.module';
import { QueueModule } from '../queue/queue.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [PrismaModule, AccountsModule, QueueModule, SyncModule],
  controllers: [MeliController, WebhooksController],
  providers: [MeliService, WebhooksService],
  exports: [MeliService, WebhooksService],
})
export class MeliModule {}
