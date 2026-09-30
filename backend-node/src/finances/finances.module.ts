import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/account.entity';
import { AuthModule } from '../auth/auth.module';
import { Transaction } from '../transactions/transaction.entity';
import { FinancesController } from './finances.controller';
import { FinancesService } from './finances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction]), AuthModule],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}
