import { Module } from '@nestjs/common';
import { ExtraRevenuesController } from './extra-revenues.controller';
import { ExtraRevenuesService } from './extra-revenues.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExtraRevenuesController],
  providers: [ExtraRevenuesService],
  exports: [ExtraRevenuesService],
})
export class ExtraRevenuesModule {}
