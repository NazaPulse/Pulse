import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Note } from './note.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), AuthModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
