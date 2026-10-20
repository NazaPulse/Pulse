/**
 * Paleta pastel de los gráficos (contrasta sobre el fondo oscuro de Pulse).
 * Azul · verde · amarillo · rosa · violeta · cian · naranja · lima.
 */
export const CHART_PALETTE = [
  '#7DB7FF',
  '#86E3AE',
  '#FFE08A',
  '#FF9FC5',
  '#B9A0FF',
  '#7FF3F9',
  '#FFB98A',
  '#C7F08A',
] as const

/** Colores que la API/`categoryForm` usan como "sin color elegido". */
const UNSET_COLORS = new Set(['#6B7280', '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'])

/**
 * Color de una porción: respeta el que eligió la persona para el sobre y, si es
 * el predeterminado (gris) o el de respaldo, usa la paleta pastel por posición.
 */
export function chartColor(color: string, index: number): string {
  if (!color || UNSET_COLORS.has(color.toUpperCase())) {
    return CHART_PALETTE[index % CHART_PALETTE.length]
  }
  return color
}

/** Estilo de una "ficha" tintada con el color del sobre (fondo translúcido + borde + texto). */
export function tintedChipStyle(color: string, index: number): Record<string, string> {
  const base = /^#[0-9a-f]{6}$/i.test(color) ? chartColor(color, index) : CHART_PALETTE[index % CHART_PALETTE.length]
  return { backgroundColor: `${base}26`, color: base, border: `1px solid ${base}55` }
}
