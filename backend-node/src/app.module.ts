import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts/account.entity';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/category.entity';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'pulse'),
        password: config.get<string>('DB_PASSWORD', 'pulse'),
        database: config.get<string>('DB_NAME', 'pulse'),
        entities: [User, Account, Category],
        // El esquema es propiedad de init.sql (única fuente de verdad).
        // El backend NO sincroniza ni migra la base.
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    UsersModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
