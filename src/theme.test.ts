import { describe, expect, it } from 'vitest'
import { isTheme, readTheme, themes } from './theme'
import { sandPaint } from './games/sand-collect/colors'

describe('theme preferences', () => {
  it('uses the vivid default for missing, invalid or inaccessible preferences', () => {
    for (const value of [null, '', 'dark', '__proto__']) expect(readTheme({ getItem: () => value })).toBe('vivid')
    expect(readTheme({ getItem: () => { throw new Error('Storage is disabled') } })).toBe('vivid')
    expect(isTheme(null)).toBe(false)
  })
  it.each(themes)('restores $id without changing the preference key', ({ id }) => {
    expect(readTheme({ getItem: key => key === 'pocket-play-theme' ? id : null })).toBe(id)
  })
  it.each(themes)('keeps sand pixels and bucket colours identical for $id', ({ id }) => {
    const palette = sandPaint(id).palette
    expect(new Set(palette.slice(1).map(paint => paint.hex)).size).toBe(8)
    for (const paint of palette) {
      expect('#' + paint.rgb.map(value => value.toString(16).padStart(2, '0')).join('')).toBe(paint.hex)
    }
  })
})
