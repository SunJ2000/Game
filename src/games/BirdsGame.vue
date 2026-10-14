<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { RotateCcw, Pause, Play, Flag, Trophy, Sparkles, ChevronRight, Star, ArrowLeft, Maximize, Minimize, Smartphone } from 'lucide-vue-next'
import BirdSprite from '../components/BirdSprite.vue'
import { BIRD_WORLD, BirdsWorld, birdLevels, clampPull, trajectory } from './birdsPhysics'
import type { Vec } from './birdsPhysics'
import { recordScore } from '../store'
const levelIndex = ref(0), campaignScore = ref(0), paused = ref(false), dragging = ref(false), pull = ref<Vec>({ ...BIRD_WORLD.anchor }), resultAge = ref(0)
const stage = ref<SVGSVGElement>()
const emit = defineEmits<{ back: [] }>()
const shell = ref<HTMLDivElement>(), scene = ref<HTMLDivElement>()
const portraitQuery = window.matchMedia('(max-width: 1024px) and (orientation: portrait)')
const landscapeQuery = window.matchMedia('(max-width: 1100px) and (max-height: 650px) and (orientation: landscape)')
const portrait = ref(portraitQuery.matches), landscape = ref(landscapeQuery.matches), fullscreen = ref(false)
const immersive = computed(() => landscape.value || fullscreen.value)
const sceneRatio = ref(600 / 500), screenMessage = ref('')
const sceneBox = computed(() => {
  if (!immersive.value) return '0 0 600 500'
  const width = Math.max(600, 360 * sceneRatio.value)
  return `${(600 - width) / 2} 140 ${width} 360`
})
let resizeObserver: ResizeObserver | undefined
function syncOrientation() { portrait.value = portraitQuery.matches; landscape.value = landscapeQuery.matches }
function syncFullscreen() { fullscreen.value = document.fullscreenElement === shell.value }
function resetClock() { cancelDrag(); last = 0; accumulator = 0 }
watch([portrait, immersive], () => {
  resetClock()
  document.body.classList.toggle('birds-immersive', immersive.value || portrait.value)
})
async function toggleFullscreen() {
  screenMessage.value = ''
  try {
    if (document.fullscreenElement === shell.value) { await document.exitFullscreen(); return }
    if (!shell.value?.requestFullscreen || !document.fullscreenEnabled) {
      screenMessage.value = '请关闭手机方向锁定，再把手机横过来，横屏会自动铺满游戏。'; return
    }
    await shell.value.requestFullscreen()
    if (portrait.value || landscape.value) {
      try { await (screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }).lock?.('landscape') } catch { /* 手动旋转仍可游玩。 */ }
    }
  } catch { screenMessage.value = '暂时无法进入全屏，直接横过来一样可以玩。' }
}
async function leaveGame() {
  try { if (document.fullscreenElement === shell.value) await document.exitFullscreen() } catch { /* 保留返回入口。 */ }
  emit('back')
}
let world = new BirdsWorld(birdLevels[0]!)
const view = shallowRef(world.snapshot())
const level = computed(() => birdLevels[levelIndex.value]!)
const points = computed(() => trajectory(pull.value))
const stars = computed(() => view.value.left >= Math.ceil(level.value.birds / 2) ? 3 : view.value.left ? 2 : 1)
const resultVisible = computed(() => ['won', 'lost'].includes(view.value.phase) && resultAge.value > 30)
const status = computed(() => paused.value ? '暂停中，快乐等你回来' : dragging.value ? '瞄准好了吗？松手让小鸟飞出去！' : view.value.phase === 'flying' ? '小鸟出发！看看这一击的威力' : view.value.phase === 'won' ? '目标全部击倒，太棒啦！' : view.value.phase === 'lost' ? '差一点点！调整角度，再挑战一次' : '按住红色小鸟，向左下拉，松手发射')
let frame = 0, last = 0, accumulator = 0, pointerId: number | undefined
function loadLevel(index: number, keepScore = false) {
  if (index < 0 || index >= birdLevels.length) return
  world.dispose(); levelIndex.value = index; world = new BirdsWorld(birdLevels[index]!); view.value = world.snapshot()
  if (!keepScore) campaignScore.value = 0
  paused.value = false; cancelDrag(); resultAge.value = 0; accumulator = 0; last = 0
}
function nextLevel() { campaignScore.value += view.value.score; loadLevel(levelIndex.value + 1, true) }
function toWorld(e: PointerEvent): Vec | undefined {
  const matrix = stage.value?.getScreenCTM()
  if (!matrix) return
  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
  return { x: point.x, y: point.y }
}
function startDrag(e: PointerEvent) {
  if (e.button !== 0 || !e.isPrimary || portrait.value || paused.value || view.value.phase !== 'ready') return
  const point = toWorld(e)
  if (!point || Math.hypot(point.x - BIRD_WORLD.anchor.x, point.y - BIRD_WORLD.anchor.y) > 64) return
  pointerId = e.pointerId; dragging.value = true; pull.value = { ...BIRD_WORLD.anchor }; stage.value?.setPointerCapture(e.pointerId); e.preventDefault()
}
function moveDrag(e: PointerEvent) { if (!dragging.value || pointerId !== e.pointerId) return; const point = toWorld(e); if (point) pull.value = clampPull(point) }
function release(e: PointerEvent) {
  if (!dragging.value || pointerId !== e.pointerId) return
  const point = toWorld(e)
  if (point) pull.value = clampPull(point)
  world.launch(pull.value); view.value = world.snapshot(); cancelDrag()
}
function cancelDrag() { if (pointerId !== undefined && stage.value?.hasPointerCapture(pointerId)) stage.value.releasePointerCapture(pointerId); dragging.value = false; pointerId = undefined; pull.value = { ...BIRD_WORLD.anchor } }
function togglePause() { paused.value = !paused.value; cancelDrag(); accumulator = 0; last = 0 }
function hidden() { if (document.hidden) { paused.value = true; cancelDrag(); last = 0; accumulator = 0 } }
function animate(time: number) {
  if (!paused.value && !portrait.value) {
    if (last) accumulator += Math.min(time - last, 100)
    let ticks = 0
    while (accumulator >= 1000 / 60 && ticks++ < 6) { world.step(); accumulator -= 1000 / 60; if (['won', 'lost'].includes(world.phase)) resultAge.value++ }
    const next = world.snapshot()
    if (next.score !== view.value.score) recordScore('birds', campaignScore.value + next.score)
    view.value = next
  }
  last = time; frame = requestAnimationFrame(animate)
}
function keyboardShot(e: KeyboardEvent) { if (e.code === 'Space' && view.value.phase === 'ready' && !paused.value && !portrait.value) { e.preventDefault(); world.launch({ x: BIRD_WORLD.anchor.x - 66, y: BIRD_WORLD.anchor.y + 24 }); view.value = world.snapshot() } else if (e.code === 'Escape' && dragging.value) cancelDrag() }
onMounted(() => {
  frame = requestAnimationFrame(animate); document.addEventListener('visibilitychange', hidden)
  portraitQuery.addEventListener('change', syncOrientation); landscapeQuery.addEventListener('change', syncOrientation)
  document.addEventListener('fullscreenchange', syncFullscreen)
  document.body.classList.toggle('birds-immersive', immersive.value || portrait.value)
  resizeObserver = new ResizeObserver(entries => { const rect = entries[0]?.contentRect; if (rect?.width && rect.height) sceneRatio.value = rect.width / rect.height })
  if (scene.value) resizeObserver.observe(scene.value)
})
onUnmounted(() => {
  cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', hidden)
  portraitQuery.removeEventListener('change', syncOrientation); landscapeQuery.removeEventListener('change', syncOrientation)
  document.removeEventListener('fullscreenchange', syncFullscreen); resizeObserver?.disconnect()
  document.body.classList.remove('birds-immersive'); world.dispose()
})
</script>
<template>
  <div ref="shell" class="birds-shell" :class="{ immersive }">
  <div class="birds-level-heading" :inert="portrait || undefined"><div><button class="birds-back" aria-label="返回游乐场" @click="leaveGame"><ArrowLeft :size="19" /></button><span class="birds-level-tag">LEVEL {{ String(levelIndex + 1).padStart(2, '0') }}</span><strong>{{ level.name }}</strong></div><div class="toolbar-actions"><button :aria-label="paused ? '继续小鸟游戏' : '暂停小鸟游戏'" @click="togglePause"><Play v-if="paused" :size="15" /><Pause v-else :size="15" /><span>{{ paused ? '继续' : '暂停' }}</span></button><button aria-label="重玩小鸟当前关卡" @click="loadLevel(levelIndex)"><RotateCcw :size="15" /><span>重玩</span></button><button :aria-label="fullscreen ? '退出全屏' : '全屏游玩'" @click="toggleFullscreen"><Minimize v-if="fullscreen" :size="15" /><Maximize v-else :size="15" /><span>{{ fullscreen ? '退出全屏' : '全屏' }}</span></button></div></div>
  <div class="birds-scorebar" :inert="portrait || undefined"><span><Trophy :size="14" />得分 <strong>{{ campaignScore + view.score }}</strong></span><span><BirdSprite kind="bird" />小鸟 <strong>{{ view.left }}</strong></span><span><Flag :size="14" />目标 <strong>{{ view.pigs }}</strong></span></div>
  <div ref="scene" class="birds-scene-wrap" :inert="portrait || undefined">
    <svg ref="stage" class="birds-scene" :viewBox="sceneBox" role="application" tabindex="0" aria-label="小鸟弹弓游戏：按住左侧红色小鸟，向左下方拖动并松手发射；空格可发射推荐角度" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="release" @pointercancel="cancelDrag" @lostpointercapture="cancelDrag" @keydown="keyboardShot">
      <defs><linearGradient id="birds-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dceff1"/><stop offset="1" stop-color="#f7f6dc"/></linearGradient><linearGradient id="birds-ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b6c994"/><stop offset="1" stop-color="#c9d6b0"/></linearGradient></defs>
      <rect x="-2000" width="4600" height="500" fill="url(#birds-sky)"/><circle cx="482" :cy="immersive ? 193 : 71" r="35" fill="#fae6ac"/><circle cx="482" :cy="immersive ? 193 : 71" r="47" fill="#fae6ac" opacity=".23"/>
      <g fill="#ffffff" opacity=".72"><path d="M29 101c0-12 13-17 22-13 5-21 37-19 42 1 19-5 31 11 26 24H30Z"/><path d="M247 51c-3-12 13-20 25-13 7-21 40-17 42 4 18-3 30 13 24 23h-91Z"/><path d="M405 165c-3-10 9-19 20-13 6-16 28-16 33 1 17-3 25 11 20 20h-73Z"/></g>
      <path d="M-2000 305H0C85 247 133 290 209 324c58-113 166-131 228-30 62-62 115-64 163-12L2600 282V500H-2000Z" fill="#c8ddba" opacity=".7"/><path d="M-2000 365H0c80-57 171-38 235 19 64-45 131-55 187-27 85-60 137-21 178 0L2600 357V500H-2000Z" fill="#b5cfa6" opacity=".6"/>
      <g transform="translate(41 262)"><path d="M0 167V43" stroke="#b4bc89" stroke-width="9"/><ellipse cx="-2" cy="26" rx="31" ry="44" fill="#a8c18e"/><ellipse cx="13" cy="-2" rx="28" ry="30" fill="#afc994"/></g>
      <path d="M-2000 436h4600v64h-4600Z" fill="url(#birds-ground)"/><path d="M-2000 435h4600" stroke="#a1b780" stroke-width="6"/><g stroke="#a0b781" stroke-width="2" opacity=".55"><path v-for="n in 12" :key="n" :d="`M${n * 48 - 20} 470l-3-8m3 8 4-7`"/></g>
      <g fill="#a1b781" opacity=".5"><ellipse cx="111" cy="443" rx="38" ry="5"/><ellipse cx="406" cy="447" rx="113" ry="6"/></g>
      <g stroke="#a38360" stroke-linecap="round"><path d="M98 432v-51l-18-45m18 45 19-45" stroke-width="13"/><path d="M96 429v-48l-16-44" stroke="#c5a37a" stroke-width="4"/></g>
      <path v-if="view.phase === 'ready'" :d="`M80 336L${pull.x} ${pull.y}L117 336`" stroke="#796555" stroke-width="5" fill="none"/>
      <g v-if="dragging" fill="#fffdf1"><circle v-for="(point, i) in points" :key="i" :cx="point.x" :cy="point.y" :r="3.2 - i * .1" :opacity="1 - i * .035"/></g>
      <g fill="#fffef0"><circle v-for="(point, i) in view.trail" :key="i" :cx="point.x" :cy="point.y" r="2" :opacity=".18 + i / view.trail.length * .5"/></g>
      <g v-for="body in view.bodies" :key="body.id" :transform="`translate(${body.x} ${body.y}) rotate(${body.angle})`">
        <template v-if="body.kind === 'block'"><rect :x="-body.width / 2" :y="-body.height / 2" :width="body.width" :height="body.height" rx="2" :fill="body.material === 'stone' ? '#a6b6b4' : '#d5ae7d'" :stroke="body.material === 'stone' ? '#889c9a' : '#b88e5e'" stroke-width="1.5"/><path v-if="body.material === 'wood'" :d="body.width > body.height ? `M${-body.width / 2 + 6} 0h${body.width - 12}` : `M0 ${-body.height / 2 + 6}v${body.height - 12}`" stroke="#b48c62" stroke-width="1" opacity=".7"/><path v-if="body.hp < 3" d="m-3-4 4 3-4 4 5 4" stroke="#98794f" stroke-width="1.5" fill="none"/></template>
        <BirdSprite v-else :kind="body.kind" :x="-body.radius * 1.12" :y="-body.radius * 1.12" :width="body.radius * 2.24" :height="body.radius * 2.24" />
      </g>
      <g v-if="view.phase === 'ready'"><circle v-if="!dragging" :cx="pull.x" :cy="pull.y" r="36" fill="none" stroke="#fffcef" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/><BirdSprite kind="bird" :x="pull.x - 23" :y="pull.y - 23" width="46" height="46"/><path :d="`M117 336L${pull.x + 8} ${pull.y + 3}`" stroke="#796555" stroke-width="3"/><g v-if="!dragging"><rect x="55" y="278" width="83" height="23" rx="11" fill="#fffcee" opacity=".95"/><text x="96" y="294" font-size="12" fill="#9a9970" text-anchor="middle">拉我，飞出去</text></g></g>
      <g v-for="n in Math.max(0, view.left - (view.phase === 'ready' ? 1 : 0))" :key="n"><BirdSprite kind="bird" :x="16 + (n - 1) * 28" y="444" width="25" height="25" /></g>
      <g v-for="burst in view.bursts" :key="burst.id" :transform="`translate(${burst.x} ${burst.y - (48 - burst.life) * .65})`" :opacity="Math.min(1, burst.life / 20)"><circle r="25" fill="#ffedb7" opacity=".55"/><text font-size="17" fill="#b38d46" text-anchor="middle" font-weight="700">{{ burst.text }}</text><path d="m-29-10-7-5m63 5 7-5m-30-18v-8" stroke="#edcf7d" stroke-width="3" stroke-linecap="round"/></g>
      <text x="579" y="483" text-anchor="end" fill="#8f9d7b" font-size="9" letter-spacing="2">PULL. AIM. FLY.</text>
    </svg>
    <div v-if="paused" class="board-overlay birds-pause"><Pause :size="34" /><h2>让快乐歇一会儿</h2><p>这一发替你暂停好了</p><button class="primary-button" @click="togglePause">继续游戏 <Play :size="16" /></button></div>
    <div v-else-if="resultVisible" class="board-overlay birds-result" role="status"><template v-if="view.phase === 'won'"><div class="birds-stars"><Star v-for="n in 3" :key="n" :size="33" :fill="n <= stars ? 'currentColor' : 'none'" :class="{ empty: n > stars }" /></div><h2>{{ levelIndex === birdLevels.length - 1 ? '全关通关，你太厉害啦！' : '漂亮的一击，过关啦！' }}</h2><p>本关 {{ view.score }} 分 · 剩余小鸟奖励 {{ view.left * 150 }} 分</p><button v-if="levelIndex < birdLevels.length - 1" class="primary-button" @click="nextLevel">下一关 <ChevronRight :size="17" /></button><button v-else class="primary-button" @click="loadLevel(0)">再挑战一轮 <Sparkles :size="17" /></button></template><template v-else><BirdSprite kind="bird" class="birds-result-sprite" /><h2>再换个角度试试</h2><p>还剩 {{ view.pigs }} 个目标，下一次更有把握</p><button class="primary-button" @click="loadLevel(levelIndex)">再来一局 <RotateCcw :size="16" /></button></template><button class="birds-secondary" @click="loadLevel(levelIndex)">重玩本关</button></div>
  </div>
  <p class="birds-status" :inert="portrait || undefined" role="status">{{ screenMessage || status }}</p>
  <div class="birds-level-picker" :inert="portrait || undefined" aria-label="选择小鸟关卡"><span>小小冒险</span><button v-for="(item, i) in birdLevels" :key="item.name" :aria-label="`第 ${i + 1} 关 ${item.name}`" :aria-pressed="levelIndex === i" :class="{ active: levelIndex === i }" @click="loadLevel(i)">{{ String(i + 1).padStart(2, '0') }}</button></div>
  <p class="game-instruction birds-instruction" :inert="portrait || undefined">拉得越远，飞得越有力；白色虚线帮你预判轨迹。<br />撞倒绿猪或用木架砸中它，击倒全部目标就过关。<br />每只绿猪 +300 分，剩余每只小鸟奖励 +150 分。</p>
  <div v-if="portrait" class="birds-rotate" role="dialog" aria-modal="true" aria-labelledby="birds-rotate-title">
    <button class="birds-rotate-back" @click="leaveGame"><ArrowLeft :size="18" />返回游乐场</button>
    <div class="birds-rotate-art"><Smartphone :size="68" :stroke-width="1.3" /><BirdSprite kind="bird" /></div>
    <span class="section-eyebrow">A WIDER VIEW, A BETTER SHOT</span>
    <h2 id="birds-rotate-title">横过来，小鸟飞得更尽兴</h2>
    <p>关闭手机方向锁定，旋转到横屏<br />游戏会自动铺满，瞄准更轻松</p>
    <button class="primary-button" @click="toggleFullscreen"><Maximize :size="17" />{{ fullscreen ? '退出全屏' : '全屏游玩' }}</button>
    <small role="status">{{ screenMessage || '旋转时自动暂停，关卡和得分都会保留' }}</small>
  </div>
  </div>
</template>
