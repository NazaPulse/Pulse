import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Valida que una fecha ISO 8601 no esté en el pasado (>= ahora).
 * `null`/`undefined` se ignoran: la obligatoriedad la decide `@IsOptional`.
 * Se usa junto a `@IsDateString` (que valida el formato).
 */
export function IsNotPastDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || value === undefined) return true;
          if (typeof value !== 'string') return false;
          const time = new Date(value).getTime();
          return !Number.isNaN(time) && time >= Date.now();
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a date equal to or later than the current date`;
        },
      },
    });
  };
}
