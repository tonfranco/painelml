import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemsController],
})
export class ItemsModule {}
