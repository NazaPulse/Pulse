import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { Account } from '../models/account.entity';
import { AccountsController } from '../controllers/accounts.controller';
import { AccountsService } from '../services/accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), AuthModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
