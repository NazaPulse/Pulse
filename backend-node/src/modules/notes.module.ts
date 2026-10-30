import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { Note } from '../models/note.entity';
import { NoteController, NotesController } from '../controllers/notes.controller';
import { NotesService } from '../services/notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), AuthModule],
  controllers: [NotesController, NoteController],
  providers: [NotesService],
})
export class NotesModule {}
