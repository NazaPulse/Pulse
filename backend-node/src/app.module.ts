import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseModule } from './common/config/database.config';
import { AuthModule } from './modules/auth.module';
import { FinanceAreaModule } from './modules/finance-area.module';
import { ProductivityAreaModule } from './modules/productivity-area.module';
import { UsersModule } from './modules/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    databaseModule,
    UsersModule,
    AuthModule,
    FinanceAreaModule,
    ProductivityAreaModule,
  ],
})
export class AppModule {}
