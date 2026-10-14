<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RotateCcw, Lightbulb, Sparkles, Hammer, Rocket, Rainbow, Shuffle, X } from 'lucide-vue-next'
import AnimalTile from '../components/AnimalTile.vue'
import { adjacent, collapseBoard, createMatchBoard, findHint, findMatches, swapTiles, powerTargets, reshuffleBoard } from './match3'
import type { TargetPower } from './match3'
import { recordScore } from '../store'
const names = ['小狐狸', '小熊', '小青蛙', '小黄鸡', '小猫', '熊猫']
const board = ref(createMatchBoard()), selected = ref(-1), score = ref(0), moves = ref(25), busy = ref(false), cleared = ref(new Set<number>()), hints = ref<number[]>([]), combo = ref(0), message = ref('交换相邻小动物，凑齐 3 个就消除！'), phase = ref<'playing' | 'won' | 'over'>('playing')
const target = 1500
const progress = computed(() => Math.min(100, score.value / target * 100))
type Power = TargetPower | 'shuffle'
const powerList = [
  { id: 'hammer' as const, name: '小木锤', detail: '敲掉一个', icon: Hammer, instruction: '点一个小动物，木锤帮你敲掉它' },
  { id: 'rocket' as const, name: '十字火箭', detail: '一行一列', icon: Rocket, instruction: '点一个小动物，消除它所在的一整行和一整列' },
  { id: 'rainbow' as const, name: '彩虹魔法', detail: '全部同色', icon: Rainbow, instruction: '点一种小动物，消除棋盘上所有同类小动物' },
  { id: 'shuffle' as const, name: '魔法重排', detail: '换个排列', icon: Shuffle, instruction: '小动物们重新排好队啦，继续寻找新组合吧' },
]
const inventory = ref<Record<Power, number>>({ hammer: 3, rocket: 1, rainbow: 1, shuffle: 2 })
const activePower = ref<TargetPower | undefined>()
let timeout: ReturnType<typeof setTimeout> | undefined, hintTimeout: ReturnType<typeof setTimeout> | undefined
let pointer: { index: number; x: number; y: number } | undefined, ignoreClick = false
function later(callback: () => void, delay: number) { clearTimeout(timeout); timeout = setTimeout(callback, delay) }
function reset() { clearTimeout(timeout); clearTimeout(hintTimeout); board.value = createMatchBoard(); selected.value = -1; score.value = 0; moves.value = 25; busy.value = false; cleared.value = new Set(); hints.value = []; combo.value = 0; phase.value = 'playing'; activePower.value = undefined; inventory.value = { hammer: 3, rocket: 1, rainbow: 1, shuffle: 2 }; message.value = '交换相邻小动物，凑齐 3 个就消除！' }
function finishTurn() {
  combo.value = 0; busy.value = false
  if (score.value >= target) { phase.value = 'won'; message.value = '目标达成，快乐满格！'; return }
  if (moves.value === 0) { phase.value = 'over'; message.value = '步数用完啦，再来一次！'; return }
  if (!findHint(board.value)) { board.value = createMatchBoard(); message.value = '没有可消除的组合啦，已免费重新排列'; return }
  message.value = '不错哦！看看下一组小动物在哪里'
}
function resolve() {
  const matches = findMatches(board.value)
  if (!matches.size) { finishTurn(); return }
  clearTiles(matches)
}
function clearTiles(matches: Set<number>, powerName?: string) {
  combo.value++; cleared.value = matches
  score.value += matches.size * 10 * combo.value
  recordScore('match3', score.value)
  message.value = powerName ? `${powerName}出击！消除 ${matches.size} 个小可爱，+${matches.size * 10} 分` : combo.value > 1 ? `${combo.value} 连消！+${matches.size * 10 * combo.value} 分，太棒啦！` : `消除了 ${matches.size} 个小可爱，+${matches.size * 10} 分`
  later(() => { board.value = collapseBoard(board.value, matches); cleared.value = new Set(); later(resolve, 280) }, 320)
}
function swap(a: number, b: number) {
  if (busy.value || activePower.value || phase.value !== 'playing' || !adjacent(a, b)) return
  busy.value = true; selected.value = -1; hints.value = []; clearTimeout(hintTimeout)
  const old = board.value; board.value = swapTiles(old, a, b)
  later(() => {
    if (!findMatches(board.value).size) { board.value = old; message.value = '这两个还不能消除哦，换个组合试试'; later(() => busy.value = false, 160) }
    else { moves.value--; resolve() }
  }, 160)
}
function choose(index: number) {
  if (ignoreClick) { ignoreClick = false; return }
  if (busy.value || phase.value !== 'playing') return
  if (activePower.value) { usePower(index); return }
  if (selected.value === index) selected.value = -1
  else if (selected.value !== -1 && adjacent(selected.value, index)) swap(selected.value, index)
  else selected.value = index
}
function hint() { if (busy.value || phase.value !== 'playing') return; activePower.value = undefined; const pair = findHint(board.value); if (pair) { hints.value = pair; message.value = '发光的两个小可爱可以交换哦'; clearTimeout(hintTimeout); hintTimeout = setTimeout(() => hints.value = [], 2200) } }
function cancelPower() { activePower.value = undefined; message.value = '道具已收好，继续交换小动物吧' }
function selectPower(power: Power) {
  if (busy.value || phase.value !== 'playing' || inventory.value[power] <= 0) return
  selected.value = -1; hints.value = []; clearTimeout(hintTimeout)
  if (power === 'shuffle') { activePower.value = undefined; inventory.value.shuffle--; busy.value = true; board.value = reshuffleBoard(board.value); message.value = '小动物们重新排好队啦，不扣步数'; later(() => busy.value = false, 280); return }
  if (activePower.value === power) { cancelPower(); return }
  activePower.value = power; message.value = powerList.find(p => p.id === power)!.instruction
}
function usePower(index: number) {
  const power = activePower.value
  if (!power || inventory.value[power] <= 0 || busy.value) return
  inventory.value[power]--; activePower.value = undefined; busy.value = true; selected.value = -1; combo.value = 0
  clearTiles(powerTargets(board.value, index, power), powerList.find(p => p.id === power)!.name)
}
function down(index: number, e: PointerEvent) { ignoreClick = false; pointer = { index, x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
function up(e: PointerEvent) {
  if (!pointer) return
  const { index, x, y } = pointer; pointer = undefined
  const dx = e.clientX - x, dy = e.clientY - y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return
  ignoreClick = true
  const next = index + (Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : -1 : dy > 0 ? 7 : -7)
  if (next >= 0 && next < 49 && adjacent(index, next)) swap(index, next)
}
onUnmounted(() => { clearTimeout(timeout); clearTimeout(hintTimeout) })
</script>
<template>
  <div class="match-stats"><div><span>当前得分</span><strong>{{ score }}<small> / {{ target }}</small></strong></div><div class="moves-stat"><span>剩余步数</span><strong :class="{ low: moves <= 5 }">{{ moves }}</strong></div><div class="toolbar-actions"><button :disabled="busy || phase !== 'playing'" @click="hint"><Lightbulb :size="16" />提示</button><button @click="reset"><RotateCcw :size="16" />重来</button></div></div>
  <div class="goal-progress"><span :style="{ width: `${progress}%` }"></span><Sparkles :size="15" /></div>
  <div class="match-message" :class="{ 'power-message': activePower }" role="status"><span v-if="combo > 1" class="combo-badge">{{ combo }} 连消</span>{{ message }}<button v-if="activePower" aria-label="取消使用道具" @click="cancelPower"><X :size="14" /></button></div>
  <div class="board-wrap match-wrap"><div class="match-board" :class="{ 'power-targeting': activePower }" :aria-busy="busy" aria-label="开心消消乐棋盘，点击两个相邻动物或滑动交换"><button v-for="(animal, i) in board" :key="i" class="animal-cell" :class="[`animal-${animal}`, { selected: selected === i, clearing: cleared.has(i), hinted: hints.includes(i) }]" :disabled="busy || phase !== 'playing'" :aria-label="`第 ${Math.floor(i / 7) + 1} 行第 ${i % 7 + 1} 列 ${names[animal]}`" :aria-pressed="selected === i" @click="choose(i)" @pointerdown="down(i, $event)" @pointerup="up" @pointercancel="pointer = undefined"><AnimalTile :animal="animal" /><span v-if="cleared.has(i)" class="tile-sparkle">✦</span></button></div><Transition name="toast"><div v-if="phase !== 'playing'" class="board-overlay match-result" role="status"><span>{{ phase === 'won' ? '🏆' : '🌿' }}</span><h2>{{ phase === 'won' ? '快乐满格，挑战成功！' : '这一局，也收获了快乐' }}</h2><p>获得 {{ score }} 分{{ phase === 'won' ? `，还剩 ${moves} 步` : '，下次再冲击 1500 分吧' }}</p><button class="primary-button" @click="reset">再来一局 <Sparkles :size="16" /></button></div></Transition></div>
  <div class="power-tray"><div class="power-tray-heading"><span><Sparkles :size="13" /> 快乐小帮手</span><small>每局免费赠送 · 不扣步数</small></div><div class="power-buttons"><button v-for="power in powerList" :key="power.id" class="power-button" :class="[power.id, { armed: activePower === power.id }]" :disabled="busy || phase !== 'playing' || inventory[power.id] === 0" :aria-label="`使用${power.name}，剩余 ${inventory[power.id]} 个`" :aria-pressed="activePower === power.id" @click="selectPower(power.id)"><span class="power-icon"><component :is="power.icon" :size="23" :stroke-width="1.7" /><span class="power-count">{{ inventory[power.id] }}</span></span><strong>{{ power.name }}</strong><small>{{ power.detail }}</small></button></div></div>
  <div class="match-legend"><AnimalTile :animal="0" /><AnimalTile :animal="2" /><AnimalTile :animal="4" /><span>小可爱们等你来消除</span></div><p class="game-instruction">点击两个相邻小动物，或直接滑动交换。<br />横向或纵向连成 3 个即可消除，连锁消除有得分加成！<br />25 步内拿到 1500 分，不成功的交换不扣步数。</p>
</template>
