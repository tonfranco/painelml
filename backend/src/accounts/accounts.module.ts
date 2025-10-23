import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
})
export class AccountsModule {}
