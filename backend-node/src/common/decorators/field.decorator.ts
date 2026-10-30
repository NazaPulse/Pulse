import { applyDecorators } from '@nestjs/common';

/**
 * Compone los decoradores (Swagger + class-validator) de una propiedad de DTO. Se listan en
 * el mismo orden en que se escribirían sobre la propiedad: TypeScript los aplica de abajo
 * hacia arriba y ese orden define el de los mensajes de validación.
 */
export function Field(...decorators: PropertyDecorator[]): PropertyDecorator {
  return applyDecorators(...[...decorators].reverse());
}
