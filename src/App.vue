<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Gamepad2, Search, ArrowUpRight, ArrowRight, Heart, Home, Clock3, Sparkles, Zap, Brain, Grid2X2, ChevronRight, X, Check, Shuffle, Github, Coffee } from 'lucide-vue-next'
import GameArt from './components/GameArt.vue'
import GameRoom from './components/GameRoom.vue'
import ThemePicker from './components/ThemePicker.vue'
import { categories, games } from './data'
import type { Game, GameId } from './data'
import { saved, toggleFavorite, recordPlay } from './store'

const page = ref('home')
const activeGame = ref<Game | undefined>()
const category = ref('全部游戏')
const search = ref('')
const toast = ref('')
let toastTimeout: ReturnType<typeof setTimeout> | undefined
const shownGames = computed(() => {
  let list = page.value === 'favorites' ? games.filter(g => saved.favorites.includes(g.id)) : page.value === 'recent' ? saved.recent.map(id => games.find(g => g.id === id)!).filter(Boolean) : games
  const aliases: Record<GameId, string> = { sand: '沙子 沙画 桶 收集 合成 顶级消除秀', match3: '消消乐 消除 三消 动物', '2048': '2048 数字 合成', birds: '愤怒 小鸟 弹弓 Angry Birds', memory: '翻牌 配对 记忆', mole: '打地鼠', mines: '扫雷 地雷', reaction: '反应 手速 测试' }
  return list.filter(g => (category.value === '全部游戏' || g.category === category.value) && `${g.name}${g.subtitle}${g.category}${aliases[g.id]}`.toLowerCase().includes(search.value.trim().toLowerCase()))
})
const heading = computed(() => page.value === 'favorites' ? '我的收藏' : page.value === 'recent' ? '最近玩过' : search.value.trim() ? '找到你的快乐' : '发现你的下一份快乐')
function syncRoute() {
  const route = location.hash.slice(1)
  const found = games.find(g => route === `/play/${g.id}`)
  activeGame.value = found
  if (found) recordPlay(found.id)
  else { page.value = route === '/favorites' ? 'favorites' : route === '/recent' ? 'recent' : 'home'; category.value = '全部游戏' }
  window.scrollTo({ top: 0 })
}
function navigate(target: string) {
  search.value = ''; category.value = '全部游戏'
  if (location.hash === `#/${target}`) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  location.hash = `/${target}`
}
function play(id: GameId) { location.hash = `/play/${id}` }
function surprise() { play(games[Math.floor(Math.random() * games.length)]!.id) }
function favorite(id: GameId) { toggleFavorite(id); toast.value = saved.favorites.includes(id) ? '已加入收藏，下次快乐更方便' : '已取消收藏'; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.value = '', 2400) }
onMounted(() => { syncRoute(); window.addEventListener('hashchange', syncRoute) })
onUnmounted(() => { window.removeEventListener('hashchange', syncRoute); clearTimeout(toastTimeout) })
</script>

<template>
  <header class="site-header" :class="{ 'library-header': !activeGame }">
    <div class="header-inner">
      <a class="brand" href="#/home" aria-label="口袋游乐场首页"><span class="brand-symbol"><Gamepad2 :size="25" :stroke-width="2.2" /></span><span>口袋游乐场<small>POCKET PLAY</small></span></a>
      <nav class="desktop-nav" aria-label="主导航">
        <button :class="{ selected: page === 'home' && !activeGame }" @click="navigate('home')">发现游戏</button>
        <button :class="{ selected: page === 'favorites' && !activeGame }" @click="navigate('favorites')">我的收藏 <span v-if="saved.favorites.length" class="count">{{ saved.favorites.length }}</span></button>
        <button :class="{ selected: page === 'recent' && !activeGame }" @click="navigate('recent')">最近玩过</button>
      </nav>
      <div class="header-right"><ThemePicker /><button class="shuffle-button" @click="surprise"><Shuffle :size="15" /> 随便玩玩</button></div>
    </div>
  </header>

  <main v-if="!activeGame" class="main-container library-page">
    <section id="games" class="games-section">
      <div class="section-heading" :class="{ 'library-home-heading': page === 'home' }">
        <h1 v-if="page === 'home'" class="library-title">小游戏</h1>
        <div v-else><h2>{{ heading }}<span class="heading-dot">.</span></h2><p>{{ page === 'favorites' ? '把喜欢的留在口袋里，快乐随时再来。' : '熟悉的小快乐，再来一局吧。' }}</p></div>
        <label class="search-box"><Search :size="18" /><input v-model="search" aria-label="搜索小游戏" placeholder="搜一搜，今天玩什么？" /><button v-if="search" aria-label="清空搜索" @click="search = ''"><X :size="15" /></button><span v-else class="search-key">⌕</span></label>
      </div>
      <div class="filter-row"><div class="category-tabs" aria-label="游戏分类"><button v-for="(item, index) in categories" :key="item" :class="{ active: category === item }" @click="category = item"><component :is="[Grid2X2, Brain, Coffee, Gamepad2, Zap][index]" :size="16" />{{ item }}</button></div><span class="game-count">{{ shownGames.length }} 个小快乐，等你发现</span></div>
      <div v-if="shownGames.length" class="game-grid">
        <article v-for="(game, index) in shownGames" :key="game.id" class="game-card" :style="{ '--card-delay': `${index * 45}ms` }">
          <div class="card-visual" :class="game.color"><button class="art-link" :aria-label="`开始玩${game.name}`" @click="play(game.id)"><GameArt :id="game.id" /></button><span class="game-tag"><span v-if="game.id === '2048'">✦ </span>{{ game.tag }}</span><button class="favorite-button" :class="{ favorited: saved.favorites.includes(game.id) }" :aria-label="`${saved.favorites.includes(game.id) ? '取消收藏' : '收藏'}${game.name}`" :aria-pressed="saved.favorites.includes(game.id)" @click="favorite(game.id)"><Heart :size="17" :fill="saved.favorites.includes(game.id) ? 'currentColor' : 'none'" /></button><span class="visual-category">{{ game.category }}</span></div>
          <div class="card-body"><div class="card-title"><h3><button @click="play(game.id)">{{ game.name }}</button></h3><span class="card-category">{{ game.category }}</span></div><p>{{ game.subtitle }}</p><div class="card-bottom"><span><Clock3 :size="13" />{{ game.duration }}<i></i>{{ game.difficulty }}</span><button :aria-label="`开始${game.name}`" @click="play(game.id)">开玩 <ArrowUpRight :size="16" /></button></div></div>
        </article>
      </div>
      <div v-else class="empty-state"><span><Heart v-if="page === 'favorites'" :size="36" /><Search v-else :size="36" /></span><h3>{{ search ? '还没找到这份快乐' : page === 'favorites' ? '口袋里还空着呢' : '第一份快乐，从这里开始' }}</h3><p>{{ search ? '试试搜索「2048」「小鸟」或其他分类。' : page === 'favorites' ? '点击游戏右上角的小爱心，收藏你的心头好。' : '选一个小游戏，让今天轻松一点。' }}</p><button class="primary-button" @click="navigate('home'); search = ''; category = '全部游戏'">发现游戏 <ArrowRight :size="16" /></button></div>
      <div v-if="shownGames.length" class="collection-note"><span></span><p>快乐不必很大，一局就刚刚好 <Sparkles :size="14" /></p><span></span></div>
    </section>

    <section class="random-banner"><div class="random-illustration"><Shuffle :size="32" /><span>?</span></div><div><span class="section-eyebrow">LET A LITTLE LUCK DECIDE</span><h3>选择困难？把快乐交给运气。</h3><p>随手抽一款，也许就是你的新欢。</p></div><button @click="surprise">给我一点惊喜 <ArrowUpRight :size="18" /></button></section>
  </main>
  <GameRoom v-else :key="activeGame.id" :game="activeGame" @back="navigate('home')" @favorite="favorite(activeGame!.id)" />

  <footer class="site-footer"><div class="footer-top"><a href="#/home" class="footer-brand"><Gamepad2 :size="19" />口袋游乐场</a><span>在这里，开心是一件很简单的事。</span><button @click="surprise">再来一点快乐 <ChevronRight :size="14" /></button></div><div class="footer-bottom"><span>© {{ new Date().getFullYear() }} Pocket Play · 用心制造小快乐</span><span><Check :size="12" /> 免费游玩 <i>·</i> 无需登录 <i>·</i> 纪录仅保存在本机</span><a href="https://github.com/topics/html5-games" target="_blank" rel="noopener noreferrer" aria-label="探索开源 H5 游戏"><Github :size="17" /></a></div></footer>
  <nav v-if="!activeGame" class="mobile-nav" aria-label="手机导航"><button :class="{ active: page === 'home' }" @click="navigate('home')"><Home :size="21" /><span>发现</span></button><button :class="{ active: page === 'favorites' }" @click="navigate('favorites')"><Heart :size="21" /><span>收藏</span></button><button :class="{ active: page === 'recent' }" @click="navigate('recent')"><Clock3 :size="21" /><span>最近</span></button><button @click="surprise"><Shuffle :size="21" /><span>随便玩</span></button></nav>
  <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><Check :size="17" />{{ toast }}</div></Transition>
</template>
