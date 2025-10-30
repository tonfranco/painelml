import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsManagementController } from './items-management.controller';
import { ItemsService } from './items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MeliModule } from '../meli/meli.module';

@Module({
  imports: [PrismaModule, MeliModule],
  controllers: [ItemsController, ItemsManagementController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
