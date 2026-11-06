import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts.module';
import { CategoriesModule } from './categories.module';
import { FinancesModule } from './finances.module';
import { TransactionsModule } from './transactions.module';

/** Agrupa los módulos de Finanzas. */
@Module({ imports: [AccountsModule, CategoriesModule, TransactionsModule, FinancesModule] })
export class FinanceAreaModule {}
