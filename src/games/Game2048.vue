<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RotateCcw, Undo2 } from 'lucide-vue-next'
import { addTile, canMove, move2048 } from './engine'
import type { Direction } from './engine'
import { recordScore } from '../store'
const board = ref<number[]>([]), score = ref(0), over = ref(false), won = ref(false), continued = ref(false)
const previous = ref<{ board: number[]; score: number }>()
let start = { x: 0, y: 0 }
function reset() { board.value = addTile(addTile(Array(16).fill(0))); score.value = 0; over.value = false; won.value = false; continued.value = false; previous.value = undefined }
function move(direction: Direction) {
  if (over.value || (won.value && !continued.value)) return
  const result = move2048(board.value, direction)
  if (!result.changed) return
  previous.value = { board: [...board.value], score: score.value }
  board.value = addTile(result.board); score.value += result.gained; recordScore('2048', score.value)
  won.value = board.value.some(v => v >= 2048); over.value = !canMove(board.value)
}
function undo() { if (!previous.value) return; board.value = previous.value.board; score.value = previous.value.score; previous.value = undefined; over.value = false; won.value = board.value.some(v => v >= 2048) }
function key(e: KeyboardEvent) { const d = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key] as Direction | undefined; if (d) { e.preventDefault(); move(d) } }
function pointerDown(e: PointerEvent) { start = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
function pointerUp(e: PointerEvent) { const dx = e.clientX - start.x, dy = e.clientY - start.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up') }
onMounted(() => { reset(); window.addEventListener('keydown', key) }); onUnmounted(() => window.removeEventListener('keydown', key))
</script>
<template>
  <div class="game-toolbar"><div class="score-pill">当前得分 <strong>{{ score }}</strong></div><div class="toolbar-actions"><button :disabled="!previous" @click="undo"><Undo2 :size="16" />撤一步</button><button @click="reset"><RotateCcw :size="16" />新一局</button></div></div>
  <div class="board-wrap"><div class="board-2048" aria-label="2048 棋盘，滑动或使用方向键合并数字" @pointerdown="pointerDown" @pointerup="pointerUp"><div v-for="(value, index) in board" :key="index" class="number-tile" :class="`tile-${Math.min(value, 2048)}`">{{ value || '' }}</div></div><div v-if="over || (won && !continued)" class="board-overlay" role="status"><span>{{ won && !over ? '✦' : '☕' }}</span><h2>{{ won && !over ? '2048！你做到了' : '这一局，也很棒' }}</h2><p>获得 {{ score }} 分</p><button class="primary-button" @click="won && !over ? continued = true : reset()">{{ won && !over ? '继续挑战' : '再来一局' }}</button></div></div>
  <p class="game-instruction">直接在棋盘上滑动，相同数字合并。<br />试着合成 2048！电脑上也可以用方向键。</p>
</template>
