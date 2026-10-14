<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { recordScore } from '../store'
const symbols = ['🍋', '🍓', '🥑', '🍒', '🍇', '🍊', '🍉', '🥝']
const cards = ref<string[]>([]), flipped = ref<number[]>([]), matched = ref<number[]>([]), moves = ref(0), seconds = ref(0), started = ref(false), locked = ref(false), done = ref(false)
let timer: ReturnType<typeof setInterval> | undefined, flipTimer: ReturnType<typeof setTimeout> | undefined
function reset() { clearInterval(timer); clearTimeout(flipTimer); const list = [...symbols, ...symbols]; for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j]!, list[i]!] }; cards.value = list; flipped.value = []; matched.value = []; moves.value = 0; seconds.value = 0; started.value = false; locked.value = false; done.value = false }
function flip(index: number) {
  if (locked.value || matched.value.includes(index) || flipped.value.includes(index) || done.value) return
  if (!started.value) { started.value = true; timer = setInterval(() => seconds.value++, 1000) }
  flipped.value.push(index)
  if (flipped.value.length === 2) {
    moves.value++; locked.value = true
    const [a, b] = flipped.value
    if (cards.value[a!] === cards.value[b!]) { matched.value.push(a!, b!); flipped.value = []; locked.value = false; if (matched.value.length === 16) { done.value = true; clearInterval(timer); recordScore('memory', Math.max(1, seconds.value), true) } }
    else flipTimer = setTimeout(() => { flipped.value = []; locked.value = false }, 850)
  }
}
reset(); onUnmounted(() => { clearInterval(timer); clearTimeout(flipTimer) })
</script>
<template>
  <div class="game-toolbar"><div class="score-pill">配对 <strong>{{ matched.length / 2 }}/8</strong><span class="toolbar-divider"></span>{{ seconds }} 秒 · {{ moves }} 次</div><div class="toolbar-actions"><button @click="reset"><RotateCcw :size="16" />重来</button></div></div>
  <div class="board-wrap"><div class="memory-board"><button v-for="(symbol, i) in cards" :key="i" class="memory-card" :class="{ flipped: flipped.includes(i) || matched.includes(i), matched: matched.includes(i) }" :aria-label="matched.includes(i) ? `已配对 ${symbol}` : flipped.includes(i) ? symbol : `翻开第 ${i + 1} 张卡片`" :disabled="matched.includes(i) || locked" @click="flip(i)"><span class="memory-back" aria-hidden="true">✳</span><span class="memory-face" aria-hidden="true">{{ symbol }}</span></button></div><div v-if="done" class="board-overlay" role="status"><span>🎉</span><h2>默契满分！</h2><p>{{ seconds }} 秒，{{ moves }} 次翻牌，找到所有小可爱</p><button class="primary-button" @click="reset">再来一局</button></div></div><p class="game-instruction">每次翻开两张卡片，找到相同的水果。<br />记住它们的位置，用更短时间完成 8 组配对！</p>
</template>
