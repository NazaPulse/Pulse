import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';

/** Raíz servida públicamente bajo `/uploads` (ver main.ts). */
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const AUDIO_UPLOAD_DIR = join(UPLOADS_ROOT, 'audio');
export const AUDIO_PUBLIC_PREFIX = '/uploads/audio';

export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (openapi.yaml)
export const UNSUPPORTED_AUDIO_MESSAGE = 'Formato de audio no soportado.';
export const MISSING_AUDIO_MESSAGE = 'Debe enviarse un archivo de audio en el campo "file".';
export const AUDIO_TOO_LARGE_MESSAGE = 'El archivo de audio supera el tamaño máximo de 10 MB.';

/**
 * MIME types aceptados -> extensión con la que se guarda el archivo. La
 * extensión se deriva del MIME (no del nombre original) para no confiar en
 * datos del cliente al construir el path en disco.
 */
export const ALLOWED_AUDIO_MIME_TYPES: Readonly<Record<string, string>> = {
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/wave': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/m4a': '.m4a',
  'audio/x-m4a': '.m4a',
};

/** Normaliza `audio/webm;codecs=opus` -> `audio/webm`. */
const baseMimeType = (mimetype: string): string => mimetype.split(';')[0].trim().toLowerCase();

export const audioUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true });
      cb(null, AUDIO_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${ALLOWED_AUDIO_MIME_TYPES[baseMimeType(file.mimetype)]}`);
    },
  }),
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_MIME_TYPES[baseMimeType(file.mimetype)]) {
      cb(null, true);
    } else {
      cb(new BadRequestException(UNSUPPORTED_AUDIO_MESSAGE), false);
    }
  },
};
