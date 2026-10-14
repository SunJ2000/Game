<script setup lang="ts">
import type { GameId } from '../data'
import AnimalTile from './AnimalTile.vue'
import BirdSprite from './BirdSprite.vue'
defineProps<{ id: GameId; hero?: boolean }>()
</script>
<template>
  <svg v-if="hero" class="hero-art" viewBox="0 0 440 300" fill="none" aria-hidden="true">
    <ellipse cx="242" cy="261" rx="136" ry="15" fill="#dfb296" opacity=".3"/>
    <circle cx="247" cy="142" r="113" fill="#ffe1b8"/>
    <path d="M157 88c-22 8-36 48-51 111-9 38 10 57 32 43l44-32h105l40 30c28 20 44-1 34-39l-24-81c-6-21-18-32-37-34Z" fill="#255944" stroke="#194332" stroke-width="5"/>
    <path d="M163 80c-22 8-36 48-51 111-9 38 10 57 32 43l44-32h105l40 30c28 20 44-1 34-39l-24-81c-6-21-18-32-37-34Z" fill="#f6fff0" stroke="#194332" stroke-width="5"/>
    <path d="M173 111v53m-26-26h53" stroke="#285c47" stroke-width="17" stroke-linecap="round"/>
    <circle cx="296" cy="116" r="12" fill="#ff9b69"/><circle cx="320" cy="141" r="12" fill="#c8e892"/>
    <circle cx="272" cy="141" r="12" fill="#c8e892"/><circle cx="296" cy="165" r="12" fill="#ff9b69"/>
    <rect x="217" y="153" width="17" height="6" rx="3" fill="#9cb09b"/><rect x="243" y="153" width="17" height="6" rx="3" fill="#9cb09b"/>
    <path d="m101 69 8-16 8 16 17 7-17 8-8 17-8-17-17-8Z" fill="#f9a363"/>
    <path d="m359 65 5-11 5 11 11 5-11 5-5 11-5-11-11-5Z" fill="#285c47"/>
    <path d="m383 215 6-12 6 12 12 6-12 5-6 13-6-13-12-5Z" fill="#f9a363"/>
    <circle cx="79" cy="179" r="7" stroke="#285c47" stroke-width="3"/><path d="m244 41 9-15m-20 11-3-15" stroke="#285c47" stroke-width="4" stroke-linecap="round"/>
    <rect x="71" y="112" width="51" height="51" rx="12" fill="#ffac78" transform="rotate(-16 71 112)"/><text x="85" y="141" fill="#fff" font-size="19" font-weight="800" transform="rotate(-16 85 141)">+1</text>
  </svg>
  <svg v-else class="game-art" viewBox="0 0 360 210" fill="none" aria-hidden="true">
    <g class="art-specks" fill="currentColor" opacity=".16"><circle cx="46" cy="45" r="4"/><circle cx="312" cy="162" r="5"/><path d="m302 34 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/><path d="m45 150 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></g>
    <g v-if="id === 'sand'">
      <rect x="113" y="16" width="138" height="127" rx="14" fill="#c8dbbb" transform="rotate(-5 182 80)" />
      <rect x="121" y="24" width="122" height="110" rx="9" fill="#63b998" transform="rotate(-5 182 80)" />
      <path d="M178 52c-17-23-43 2-24 23l27 25 25-27c18-24-11-45-28-21Z" fill="#f2c866" />
      <path d="M126 130c-8 14-8 22 3 28m61-28c4 17 7 17 14 29" stroke="#f2c866" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 7" />
      <rect x="82" y="173" width="197" height="19" rx="9" fill="#adc59d" />
      <g v-for="(color, i) in ['#63b998', '#f2c866', '#e58c9f']" :key="color" :transform="`translate(${96 + i * 62} 142)`"><path d="M0 3 5 29Q20 40 35 29L40 3Z" :fill="color" stroke="#fffdf1" stroke-width="2" /><ellipse cx="20" cy="3" rx="20" ry="7" :fill="color" stroke="#fffdf1" stroke-width="2" /><ellipse cx="20" cy="3" rx="15" ry="4" fill="#2b4d3b" opacity=".18" /></g>
    </g>
    <g v-else-if="id === 'match3'" transform="rotate(-9 180 105)">
      <rect x="104" y="20" width="154" height="174" rx="19" fill="#a6bc7f" opacity=".3"/>
      <rect x="98" y="14" width="154" height="174" rx="19" fill="#c5d6a5"/>
      <g v-for="(animal, i) in [0, 2, 4, 3, 1, 3, 0, 5, 4]" :key="i" :transform="`translate(${106 + i % 3 * 47}, ${24 + Math.floor(i / 3) * 51})`"><rect width="43" height="47" rx="9" fill="#fffff0"/><svg x="2" y="2" width="39" height="43" viewBox="0 0 64 64"><AnimalTile :animal="animal" /></svg></g>
      <path d="m261 63 7 14 15 6-15 6-7 14-7-14-15-6 15-6Z" fill="#e6aa5e"/><path d="m83 132 4 8 9 4-9 4-4 8-4-8-9-4 9-4Z" fill="#91af6b"/>
    </g>
    <g v-else-if="id === '2048'" transform="rotate(-8 180 105)">
      <rect x="106" y="24" width="153" height="165" rx="17" fill="#d69a7b" opacity=".22"/>
      <rect x="101" y="18" width="153" height="165" rx="17" fill="#edc5ae"/>
      <rect x="113" y="30" width="60" height="65" rx="10" fill="#fff4e7"/><rect x="181" y="30" width="60" height="65" rx="10" fill="#ffdfb8"/>
      <rect x="113" y="103" width="60" height="65" rx="10" fill="#f4ad75"/><rect x="181" y="103" width="60" height="65" rx="10" fill="#f57c4c"/>
      <g font-family="Arial,sans-serif" text-anchor="middle" font-weight="800"><text x="143" y="73" font-size="28" fill="#987454">2</text><text x="211" y="73" font-size="28" fill="#987454">4</text><text x="143" y="146" font-size="28" fill="white">8</text><text x="211" y="144" font-size="22" fill="white">2048</text></g>
    </g>
    <g v-else-if="id === 'birds'">
      <ellipse cx="182" cy="181" rx="113" ry="10" fill="#bad2b1" opacity=".6"/>
      <path d="M91 174v-38l-15-36m15 36 16-36" stroke="#a58662" stroke-width="10" stroke-linecap="round"/><path d="m76 101 18 5 14-5" stroke="#77604c" stroke-width="3"/>
      <path d="M161 72q50-48 94 16" stroke="#fffdf2" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 9"/>
      <BirdSprite kind="bird" x="94" y="57" width="93" height="93" transform="rotate(-17 139 103)"/>
      <rect x="215" y="124" width="12" height="49" rx="3" fill="#cfa979"/><rect x="275" y="124" width="12" height="49" rx="3" fill="#cfa979"/><rect x="209" y="113" width="84" height="13" rx="3" fill="#d8b788"/><BirdSprite kind="pig" x="230" y="131" width="44" height="44"/>
      <path d="m184 120 5 10 11 5-11 4-5 10-4-10-11-4 11-5Z" fill="#efbe7b"/>
    </g>
    <g v-else-if="id === 'memory'">
      <rect x="100" y="47" width="85" height="119" rx="12" fill="#c6bbe2" transform="rotate(-15 100 47)"/>
      <rect x="107" y="40" width="85" height="119" rx="12" fill="#a896ca" stroke="#f7f1ff" stroke-width="4" transform="rotate(-15 107 40)"/>
      <path d="m140 76 7 13 14 4-10 11v15l-14-6-14 4 2-15-9-12 15-2Z" fill="#eae0fc"/>
      <rect x="184" y="47" width="86" height="119" rx="12" fill="#c4b7dd" transform="rotate(12 184 47)"/>
      <rect x="178" y="39" width="86" height="119" rx="12" fill="#fffaf0" stroke="white" stroke-width="4" transform="rotate(12 178 39)"/>
      <path d="M215 85c-18-24-45 5-23 25l17 17 23-17c26-16 4-49-17-25Z" fill="#ef9bb0"/>
    </g>
    <g v-else-if="id === 'mole'">
      <ellipse cx="172" cy="163" rx="73" ry="20" fill="#ceb77c"/><ellipse cx="172" cy="157" rx="60" ry="13" fill="#86694d"/>
      <path d="M129 158v-43c0-63 87-63 87 0v43Z" fill="#b88c67"/><ellipse cx="140" cy="91" rx="13" ry="16" fill="#b88c67"/><ellipse cx="207" cy="91" rx="13" ry="16" fill="#b88c67"/>
      <ellipse cx="172" cy="131" rx="31" ry="24" fill="#e5c4a1"/><ellipse cx="172" cy="121" rx="10" ry="7" fill="#6a4c3b"/><circle cx="153" cy="109" r="4" fill="#473e34"/><circle cx="193" cy="109" r="4" fill="#473e34"/><path d="M161 136q11 12 22 0" stroke="#6a4c3b" stroke-width="3" stroke-linecap="round"/>
      <rect x="254" y="64" width="13" height="74" rx="5" fill="#b38764" transform="rotate(31 254 64)"/><rect x="224" y="37" width="65" height="38" rx="9" fill="#ea9d70" transform="rotate(31 224 37)"/><path d="m218 43-10-8m42-6 2-13" stroke="#c4a45a" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g v-else-if="id === 'mines'" transform="rotate(-9 180 105)">
      <rect x="109" y="30" width="145" height="145" rx="13" fill="#b7cbd8"/>
      <g fill="#ecf6f8"><rect x="119" y="40" width="37" height="37" rx="6"/><rect x="163" y="40" width="37" height="37" rx="6"/><rect x="207" y="40" width="37" height="37" rx="6"/><rect x="119" y="84" width="37" height="37" rx="6"/><rect x="163" y="84" width="37" height="37" rx="6"/><rect x="207" y="84" width="37" height="37" rx="6"/><rect x="119" y="128" width="37" height="37" rx="6"/><rect x="163" y="128" width="37" height="37" rx="6"/><rect x="207" y="128" width="37" height="37" rx="6"/></g>
      <g font-family="Arial" font-size="25" text-anchor="middle" font-weight="700" fill="#78a3b6"><text x="181" y="68">1</text><text x="137" y="113">2</text><text x="225" y="157">1</text></g>
      <path d="M181 96v22m-7 0h14" stroke="#756c64" stroke-width="3" stroke-linecap="round"/><path d="M182 95h18l-5 8h-13Z" fill="#ed957f"/>
    </g>
    <g v-else>
      <circle cx="182" cy="114" r="66" fill="#dab5bd" opacity=".35"/><circle cx="180" cy="106" r="66" fill="#fff9f7" stroke="#d797a9" stroke-width="7"/>
      <rect x="168" y="18" width="24" height="14" rx="5" fill="#bb8697"/><path d="m226 53 10-13" stroke="#bb8697" stroke-width="12"/>
      <g stroke="#dcb6bf" stroke-width="4" stroke-linecap="round"><path d="M180 53v7m0 92v7m-53-53h7m92 0h7"/></g>
      <path d="m189 72-33 40h22l-7 30 33-42h-22Z" fill="#ed9c5d"/><path d="m95 76-18 9m20 12-26 3m31 17-17 7" stroke="#d797a9" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>
</template>
