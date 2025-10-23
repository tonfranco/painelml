import { Module } from '@nestjs/common';
import { MeliController } from './meli.controller';
import { MeliService } from './meli.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeliController, WebhooksController],
  providers: [MeliService],
  exports: [MeliService],
})
export class MeliModule {}
