import { readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'

// Regenerate after changing paintings, collection speed, or simulation rules.
async function loadTypeScript(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { SandCollector, PALETTE } = await loadTypeScript('../src/games/sand-collect/engine.ts')
const { makeSandPainting, paintingCount } = await loadTypeScript('../src/games/sand-collect/patterns.ts')
const recipes = []
for (let index = 0; index < paintingCount; index++) {
  const level = makeSandPainting(index), game = new SandCollector(level)
  const columns = Array.from({ length: 4 }, () => []), solution = [], reserved = new Int32Array(PALETTE.length)
  const sizes = index < 2 ? [400, 600, 800, 1000] : [200, 400, 600, 800, 1000, 1200]
  let sent = 0
  function send(color, capacity, tick) {
    // Balance queue lengths, while avoiding a permanently dedicated color lane.
    const column = columns.map((queue, lane) => ({ lane, weight: queue.length * 2 + (queue.at(-1)?.color === color ? 3 : 0) }))
      .sort((a, b) => a.weight - b.weight || a.lane - b.lane)[0].lane
    const spec = { color, capacity }
    game.columns[column].push(spec)
    if (game.send(column) !== 'sent') throw new Error('Generation send failed')
    columns[column].push(spec); solution.push({ tick, column }); reserved[color] += capacity; sent++
  }
  game.start()
  // The first row also includes colors waiting deeper in the painting.
  // These remain real occupied buckets: clearing the background must expose their sand.
  const buried = Array.from(new Set(level.sand)).filter(color => color && color !== level.sand.at(-1))
  for (const color of buried.slice(0, index === 7 ? 0 : 2)) send(color, Math.min(game.colorLeft[color], 200 + index % 3 * 200), 0)
  for (let tick = 0; tick < 60000 && game.phase === 'playing'; tick++) {
    if (tick % 15 === 0) {
      const exposed = new Map()
      for (let x = 0; x < level.width; x++) for (let d = 0; d < game.depth; d++) {
        const y = game.bottom[x] - d
        if (y >= 0 && game.grid[y * level.width + x]) {
          const color = game.grid[y * level.width + x]
          exposed.set(color, (exposed.get(color) ?? 0) + 1)
        }
      }
      for (const [color, available] of exposed) {
        if (game.buckets.length >= 6 || game.buckets.some(bucket => bucket.color === color)) continue
        const capacity = Math.min(game.colorLeft[color] - reserved[color], sizes[(sent + index) % sizes.length], index === 7 && game.colorLeft[color] < 800 ? available : Infinity)
        if (capacity <= 0) continue
        send(color, capacity, tick)
      }
    }
    const before = game.collected
    game.step(); game.takeEvents()
    if (game.collected > before) {
      reserved.fill(0)
      for (const bucket of game.buckets) reserved[bucket.color] += bucket.remaining
    }
  }
  if (game.phase !== 'won' || game.buckets.length) throw new Error(`${level.name}: no complete solution (${game.phase}, ${game.collected}/${game.total}), active ${JSON.stringify(game.buckets.map(b => [b.color, b.remaining]))}, colors ${Array.from(game.colorLeft)}`)
  recipes.push({ columns, solution })
  console.log(`${index + 1}. ${level.name}: ${new Set(level.sand).size - 1} colors, ${sent} buckets, ${(game.ticks / 30).toFixed(0)}s solution`)
}
await writeFile(new URL('../src/games/sand-collect/level-recipes.json', import.meta.url), JSON.stringify(recipes.map(recipe => recipe.columns), null, 2) + '\n')
await writeFile(new URL('../src/games/sand-collect/solutions.json', import.meta.url), JSON.stringify(recipes.map(recipe => recipe.solution), null, 2) + '\n')
