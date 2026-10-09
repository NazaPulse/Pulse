import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Response } from 'express';
import { AUDIO_TOO_LARGE_MESSAGE } from './audio-upload.config';

/**
 * Multer reporta el exceso de tamaño como `413`; openapi.yaml exige `400`
 * para "tamaño mayor a 10 MB" en `POST /api/notes/upload-audio`.
 */
@Catch(PayloadTooLargeException)
export class AudioUploadExceptionFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = new BadRequestException(AUDIO_TOO_LARGE_MESSAGE);
    response.status(error.getStatus()).json(error.getResponse());
  }
}
