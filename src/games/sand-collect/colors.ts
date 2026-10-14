import type { ThemeId } from '../../theme'
import { PALETTE } from './engine'

const vivid = ['#000000', '#13bd85', '#ffca30', '#ff5b91', '#30aff4', '#9754e8', '#ff882e', '#f2f5ff', '#294576']
const sunset = ['#000000', '#14b891', '#ffd044', '#f84c8d', '#24a8dc', '#ad56e1', '#ff803d', '#fff5e7', '#384c7a']
function palette(hexes: readonly string[]) {
  return PALETTE.map((paint, i) => {
    const hex = hexes[i]!
    return { ...paint, hex, rgb: [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) }
  })
}
const paints = {
  soft: { palette: palette(PALETTE.map(paint => paint.hex)), scene: '#e9f1e5', frame: '#d9e6d4', paper: '#fffdf1', beltEdge: '#b3c6ad', belt: '#c7d7bd', beltLine: '#afc3a6' },
  vivid: { palette: palette(vivid), scene: '#f0ecff', frame: '#d8cef5', paper: '#fffdf7', beltEdge: '#a18ae2', belt: '#d7cafa', beltLine: '#b39be9' },
  sunset: { palette: palette(sunset), scene: '#fff0e5', frame: '#ffd3bb', paper: '#fffdf6', beltEdge: '#e9a07f', belt: '#ffd3b7', beltLine: '#eda981' },
}
export function sandPaint(theme: ThemeId) { return paints[theme] }
