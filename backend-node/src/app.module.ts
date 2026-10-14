import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './models/account.entity';
import { AccountsModule } from './modules/accounts.module';
import { AuthModule } from './modules/auth.module';
import { CategoriesModule } from './modules/categories.module';
import { Category } from './models/category.entity';
import { FinancesModule } from './modules/finances.module';
import { Note } from './models/note.entity';
import { NotesModule } from './modules/notes.module';
import { Task } from './models/task.entity';
import { TasksModule } from './modules/tasks.module';
import { Transaction } from './models/transaction.entity';
import { TransactionsModule } from './modules/transactions.module';
import { User } from './models/user.entity';
import { UsersModule } from './modules/users.module';

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
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'pulse'),
        entities: [User, Account, Category, Transaction, Task, Note],
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
    TransactionsModule,
    FinancesModule,
    TasksModule,
    NotesModule,
  ],
})
export class AppModule {}
