import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Validación global: rechaza propiedades no declaradas (additionalProperties: false
  // en openapi.yaml) y transforma los payloads a instancias de DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Documentación interactiva en /api/docs (PROYECTO.md · Objetivo 5).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulse API')
    .setDescription('Backend A (NestJS). Contrato: openapi.yaml en la raíz del repo.')
    .setVersion('0.3.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
