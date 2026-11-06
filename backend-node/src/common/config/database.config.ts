import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../models/account.entity';
import { Category } from '../../models/category.entity';
import { Note } from '../../models/note.entity';
import { Task } from '../../models/task.entity';
import { TimeBlock } from '../../models/time-block.entity';
import { Transaction } from '../../models/transaction.entity';
import { User } from '../../models/user.entity';

/** Conexión a PostgreSQL con las credenciales del entorno (`DB_*`). */
export const databaseModule = TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USER', 'pulse'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME', 'pulse'),
    entities: [User, Account, Category, Transaction, Task, Note, TimeBlock],
    // El esquema es propiedad de init.sql (única fuente de verdad).
    // El backend NO sincroniza ni migra la base.
    synchronize: false,
    migrationsRun: false,
  }),
});
