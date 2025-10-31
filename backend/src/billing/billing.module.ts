import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MeliModule } from '../meli/meli.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { TaxesModule } from '../taxes/taxes.module';

@Module({
  imports: [PrismaModule, MeliModule, ExpensesModule, TaxesModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
