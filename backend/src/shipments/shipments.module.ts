import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { PendingShipmentsController } from './pending-shipments.controller';
import { TestSLAController } from './test-sla.controller';
import { ShipmentsService } from './shipments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MeliModule } from '../meli/meli.module';

@Module({
  imports: [PrismaModule, MeliModule],
  controllers: [ShipmentsController, PendingShipmentsController, TestSLAController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
