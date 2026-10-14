import type { SandLevel } from './engine'

const WIDTH = 160, HEIGHT = 160
const names = ['甜心花园', '向阳花开', '雨后彩虹', '冰淇淋派对', '蝴蝶秘境', '星际旅行', '森林小狐狸', '八色万花筒']
const hints = ['先收底部颜色，再给花朵留位置', '小桶先装满，大桶留给大片沙子', '彩虹一层一层露出，别急着把位置放满', '观察后排颜色，提前留出需要的位置', '六个位置要收六种颜色，留意谁能先装满', '颜色比位置多，暂时用不到的桶不要上太多', '先收露出的颜色，再解开藏在后排的桶', '八种颜色只有六个位置，选桶顺序很关键']
const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1

/** Stable pixel paintings: background is sand, so pictures stay intact until collection. */
export function makeSandPainting(index: number): SandLevel {
  const sand = new Uint8Array(WIDTH * HEIGHT)
  for (let y = 16; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const dx = x - 80, dy = y - 84, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx)
    let color = 1
    if (index === 0) {
      const nx = dx / 46, ny = (y - 73) / 46
      if ((nx * nx + ny * ny - .7) ** 3 - nx * nx * (-ny) ** 3 < 0) color = 3
      if (ellipse(x, y, 60, 53, 7, 4)) color = 2
      for (const cx of [24, 136]) {
        if (Math.abs(x - cx) < 2 && y > 121) color = 2
        const fr = Math.hypot(x - cx, y - 126), fa = Math.atan2(y - 126, x - cx)
        if (fr < 10 + Math.cos(fa * 5) * 3) color = 3
        if (fr < 4) color = 2
      }
    } else if (index === 1) {
      if (Math.abs(dx) < 4 && y > 85) color = 2
      if (ellipse(x, y, 62, 125, 16, 6) || ellipse(x, y, 99, 111, 16, 6)) color = 4
      if (r < 43 + Math.cos(a * 10) * 10 && y < 132) color = 2
      if (r < 26) color = 6
      if (r < 19) color = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 6 : 2)
      if (y < 50 && ellipse(x, y, 21, 33, 12, 4)) color = 4
    } else if (index === 2) {
      color = 4
      const arch = Math.hypot(dx, y - 113)
      if (y < 113 && arch < 68 && arch > 25) color = [3, 6, 2, 1, 5][Math.min(4, Math.floor((68 - arch) / 9))]!
      for (const cx of [29, 127]) if (ellipse(x, y, cx, 112, 23, 9) || ellipse(x, y, cx - 8, 105, 10, 11) || ellipse(x, y, cx + 8, 102, 12, 14)) color = 2
      if (y > 136 + Math.sin(x / 19) * 4) color = 1
    } else if (index === 3) {
      color = 5
      if (y > 91 && y < 151 && Math.abs(dx) < (153 - y) * .48) {
        color = 2
        if ((x + y) % 15 < 2 || (x - y + 200) % 15 < 2) color = 6
      }
      if (ellipse(x, y, 60, 79, 24, 24)) color = 1
      if (ellipse(x, y, 102, 79, 24, 24)) color = 2
      if (ellipse(x, y, 80, 57, 25, 25)) color = 3
      if (Math.abs(x - 80) < 2 && y > 27 && y < 39) color = 1
      if (ellipse(x, y, 83, 36, 6, 6)) color = 6
      for (const [cx, cy] of [[67, 49], [84, 60], [94, 43], [53, 76], [108, 75]]) if (Math.abs(x - cx!) < 2 && Math.abs(y - cy!) < 4) color = 5
    } else if (index === 4) {
      color = 4
      const bx = Math.abs(dx)
      if (ellipse(bx, y, 30, 61, 33, 36)) color = 5
      if (ellipse(bx, y, 25, 105, 25, 28)) color = 3
      if (ellipse(bx, y, 33, 59, 23, 24)) color = 6
      if (ellipse(bx, y, 25, 103, 17, 19)) color = 2
      if (ellipse(bx, y, 33, 59, 10, 14)) color = 1
      if (ellipse(bx, y, 24, 101, 7, 10)) color = 5
      if (bx < 4 && y > 40 && y < 124) color = 5
      if (y > 29 && y < 47 && Math.abs(bx - (47 - y) * .5) < 1.7) color = 5
      if (y > 141 + Math.sin(x / 12) * 4) color = 1
    } else if (index === 5) {
      color = 5
      for (const [cx, cy] of [[22, 40], [135, 62], [30, 102], [124, 130]]) if (Math.abs(x - cx!) + Math.abs(y - cy!) < 5) color = 2
      if (ellipse(x, y, 123, 35, 15, 13)) color = 4
      if (ellipse(x, y, 123, 35, 23, 3) && !ellipse(x, y, 123, 35, 12, 13)) color = 1
      if (y > 104 && y < 151 && Math.abs(dx) < (151 - y) * .28) color = 2
      if (y > 104 && y < 142 && Math.abs(dx) < (142 - y) * .2) color = 6
      if (y > 41 && y < 108 && Math.abs(dx) < Math.min(18, (y - 33) * .65)) color = 7
      if (y > 38 && y < 58 && Math.abs(dx) < (y - 33) * .65) color = 3
      if (y > 85 && y < 114 && Math.abs(dx) < 31 - Math.abs(y - 101) * .65 && Math.abs(dx) > 16) color = 3
      if (ellipse(x, y, 80, 74, 11, 11)) color = 1
      if (ellipse(x, y, 80, 74, 7, 7)) color = 4
    } else if (index === 6) {
      color = 4
      if (y > 143 + Math.sin(x / 18) * 5) color = 1
      if (y > 28 && y < 77 && Math.abs(dx) > 23 && Math.abs(dx) < 49 - (y - 28) * .15 && Math.abs(dx) > (74 - y) * .65) color = 6
      if (y > 39 && y < 71 && Math.abs(dx) > 28 && Math.abs(dx) < 41 - (y - 39) * .16) color = 3
      if (ellipse(x, y, 80, 86, 46, 43)) color = 6
      if (y > 88 && y < 130 && Math.abs(dx) < (y - 86) * 1.1) color = 7
      if (ellipse(x, y, 60, 87, 4, 6) || ellipse(x, y, 100, 87, 4, 6) || Math.abs(dx) + Math.abs(y - 112) < 6) color = 8
      if (ellipse(x, y, 47, 103, 7, 4) || ellipse(x, y, 113, 103, 7, 4)) color = 3
      for (const cx of [16, 145]) if (y > 76 && y < 128 && Math.abs(x - cx) < (y - 66) * .18) color = 1
      if (y < 49 && ellipse(x, y, 15, 34, 7, 7)) color = 2
    } else {
      color = 8
      const petalRadius = r + Math.cos(a * 8) * 3
      if (r < 66) color = 1 + (Math.floor(petalRadius / 9) + 7) % 7
      if (r < 12) color = 2
      if (r > 61 && r < 65 || r > 28 && r < 30) color = 7
    }
    sand[y * WIDTH + x] = color
  }
  return { name: names[index]!, hint: hints[index]!, width: WIDTH, height: HEIGHT, sand, columns: Array.from({ length: 4 }, () => []), depth: 6, seed: 73 + index, difficulty: index < 2 ? 0 : index < 5 ? 1 : 2 }
}

export const paintingCount = names.length
