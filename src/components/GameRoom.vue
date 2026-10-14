<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Heart, Trophy, ShieldCheck, ChevronRight } from 'lucide-vue-next'
import type { Game } from '../data'
import { games } from '../data'
import { saved } from '../store'
import GameArt from './GameArt.vue'
import Game2048 from '../games/Game2048.vue'
import BirdsGame from '../games/BirdsGame.vue'
import MemoryGame from '../games/MemoryGame.vue'
import MoleGame from '../games/MoleGame.vue'
import MinesGame from '../games/MinesGame.vue'
import ReactionGame from '../games/ReactionGame.vue'
import Match3Game from '../games/Match3Game.vue'
import SandCollectGame from '../games/SandCollectGame.vue'
const props = defineProps<{ game: Game }>()
defineEmits<{ back: []; favorite: [] }>()
const component = computed(() => ({ sand: SandCollectGame, match3: Match3Game, '2048': Game2048, birds: BirdsGame, memory: MemoryGame, mole: MoleGame, mines: MinesGame, reaction: ReactionGame })[props.game.id])
const best = computed(() => saved.scores[props.game.id])
const unit = computed(() => props.game.id === 'reaction' ? 'ms' : ['memory', 'mines'].includes(props.game.id) ? '秒' : '分')
</script>
<template>
  <main class="main-container play-container" :class="{ 'sand-room': game.id === 'sand' }">
    <div class="play-breadcrumb"><button @click="$emit('back')"><ArrowLeft :size="17" /> 返回游乐场</button><span>/</span><span>{{ game.name }}</span></div>
    <div class="play-layout">
      <section class="game-panel" :class="{ 'birds-panel': game.id === 'birds' }"><div class="game-panel-heading"><div><span class="section-eyebrow">A LITTLE CHALLENGE FOR YOU</span><h1>{{ game.name }}</h1><p>{{ game.subtitle }}</p></div><button class="room-favorite" :class="{ favorited: saved.favorites.includes(game.id) }" :aria-label="saved.favorites.includes(game.id) ? '取消收藏' : '收藏游戏'" :aria-pressed="saved.favorites.includes(game.id)" @click="$emit('favorite')"><Heart :size="20" :fill="saved.favorites.includes(game.id) ? 'currentColor' : 'none'" /></button></div><component :is="component" @back="$emit('back')" /></section>
      <aside class="play-sidebar"><div class="best-card"><Trophy :size="24" /><span>我的最佳纪录</span><strong>{{ best ?? '—' }}<small v-if="best">{{ unit }}</small></strong><p>{{ best ? '每一次小进步，都值得开心。' : '来一局，留下你的第一个纪录。' }}</p></div><div class="side-note"><ShieldCheck :size="18" /><div><strong>快乐只属于你</strong><p>纪录自动保存在当前浏览器<br />无需注册，随时开玩</p></div></div><div class="more-games"><h3>下一局，玩点别的</h3><a v-for="other in games.filter(g => g.id !== game.id).slice(0, 3)" :key="other.id" :href="`#/play/${other.id}`"><span class="mini-art" :class="other.color"><GameArt :id="other.id" /></span><span><strong>{{ other.name }}</strong><small>{{ other.category }}</small></span><ChevronRight :size="17" /></a></div></aside>
    </div>
  </main>
</template>
