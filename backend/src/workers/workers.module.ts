import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookWorkerService } from './webhook-worker.service';
import { QueueModule } from '../queue/queue.module';
import { ItemsModule } from '../items/items.module';
import { OrdersModule } from '../orders/orders.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { QuestionsModule } from '../questions/questions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueModule,
    ItemsModule,
    OrdersModule,
    ShipmentsModule,
    QuestionsModule,
    PrismaModule,
  ],
  providers: [WebhookWorkerService],
  exports: [WebhookWorkerService],
})
export class WorkersModule {}
