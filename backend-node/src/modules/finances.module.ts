import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../models/account.entity';
import { AuthModule } from './auth.module';
import { Transaction } from '../models/transaction.entity';
import { FinancesController } from '../controllers/finances.controller';
import { FinancesService } from '../services/finances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction]), AuthModule],
  controllers: [FinancesController],
  providers: [FinancesService],
})
export class FinancesModule {}
