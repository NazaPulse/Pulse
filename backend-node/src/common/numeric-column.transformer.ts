import { ValueTransformer } from 'typeorm';

/**
 * El driver `pg` devuelve las columnas `NUMERIC` como `string` (para no
 * perder precisión). openapi.yaml exige `number`/`float` en las respuestas,
 * así que esta clase convierte en ambos sentidos.
 */
export class NumericColumnTransformer implements ValueTransformer {
  to(value?: number | null): number | null | undefined {
    return value;
  }

  from(value?: string | null): number | null | undefined {
    if (value === null || value === undefined) return value;
    return parseFloat(value);
  }
}
