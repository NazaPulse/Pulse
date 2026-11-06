import { BadRequestException, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

export const NOT_FOUND_MESSAGE = 'Recurso no encontrado.';
export const EMPTY_UPDATE_MESSAGE = 'Debe enviarse al menos un campo para actualizar.';

/** Registro con dueño: toda consulta por `id` filtra también por `userId`. */
export type OwnedRow = ObjectLiteral & { id: string; userId: string };

/**
 * Aislamiento por usuario: cualquier operación por `id` filtra siempre por `userId`. Un `id`
 * de otro usuario (o inexistente, o con formato inválido) responde `404` — nunca revela si el
 * recurso existe para otro usuario. `extra` agrega condiciones (por ejemplo, `isActive`).
 */
export async function findOwnedOrFail<T extends OwnedRow>(
  repository: Repository<T>,
  userId: string,
  id: string,
  extra: FindOptionsWhere<T> = {},
): Promise<T> {
  if (!isUUID(id)) {
    throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
  const row = await repository.findOne({ where: { id, userId, ...extra } as FindOptionsWhere<T> });
  if (!row) {
    throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
  return row;
}

/** `404` si no existe un registro `id` del usuario (por ejemplo, una tarea vinculada). */
export async function assertOwned<T extends OwnedRow>(repository: Repository<T>, userId: string, id: string) {
  const exists = await repository.exists({ where: { id, userId } as FindOptionsWhere<T> });
  if (!exists) {
    throw new NotFoundException(NOT_FOUND_MESSAGE);
  }
}

/** Edición parcial: `400` si el payload no trae ningún campo. */
export function assertNotEmptyUpdate(dto: object): void {
  if (Object.values(dto).every((value) => value === undefined)) {
    throw new BadRequestException(EMPTY_UPDATE_MESSAGE);
  }
}

type Present<T> = { [K in keyof T]?: Exclude<T[K], null | undefined> };
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/** Sólo las entradas con valor (ni `undefined` ni `null`): columnas NOT NULL que ignoran un `null`. */
export function pickPresent<T extends object>(values: T): Present<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null),
  ) as Present<T>;
}

/** Sólo las entradas enviadas (distintas de `undefined`): columnas anulables donde `null` borra. */
export function pickDefined<T extends object>(values: T): Defined<T> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Defined<T>;
}

/** Fecha ISO a `Date`, conservando `null`/`undefined`. */
export function toDate<T extends null | undefined>(value: string | T): Date | T {
  return value === null || value === undefined ? (value as T) : new Date(value);
}
