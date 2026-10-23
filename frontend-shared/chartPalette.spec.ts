import { CHART_PALETTE, chartColor, tintedChipStyle } from './chartPalette'

describe('chartColor', () => {
  it('respeta el color elegido para el sobre', () => {
    expect(chartColor('#123ABC', 0)).toBe('#123ABC')
  })

  it.each(['', '#6b7280', '#6366F1'])('el color por defecto (%s) usa la paleta pastel por posición', (color) => {
    expect(chartColor(color, 1)).toBe(CHART_PALETTE[1])
    expect(chartColor(color, CHART_PALETTE.length)).toBe(CHART_PALETTE[0])
  })
})

describe('tintedChipStyle', () => {
  it('tiñe fondo, borde y texto con el mismo color', () => {
    expect(tintedChipStyle('#112233', 0)).toEqual({
      backgroundColor: '#11223326',
      color: '#112233',
      border: '1px solid #11223355',
    })
  })

  it('un color inválido cae en la paleta', () => {
    expect(tintedChipStyle('rojo', 2).color).toBe(CHART_PALETTE[2])
  })
})
