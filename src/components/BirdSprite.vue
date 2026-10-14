<script setup lang="ts">
defineProps<{ kind?: 'bird' | 'pig' }>()
</script>
<template>
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <g v-if="kind === 'pig'"><circle cx="16" cy="13" r="9" fill="#86af5c"/><circle cx="47" cy="13" r="9" fill="#86af5c"/><circle cx="16" cy="13" r="4" fill="#aacb87"/><circle cx="47" cy="13" r="4" fill="#aacb87"/><ellipse cx="32" cy="35" rx="28" ry="26" fill="#9cc56b" stroke="#79a351" stroke-width="2"/><ellipse cx="19" cy="28" rx="7" ry="8" fill="#fffceb"/><ellipse cx="45" cy="28" rx="7" ry="8" fill="#fffceb"/><circle cx="21" cy="29" r="3" fill="#42523a"/><circle cx="43" cy="29" r="3" fill="#42523a"/><ellipse cx="32" cy="42" rx="14" ry="10" fill="#bfdb8d" stroke="#80a357" stroke-width="1.5"/><ellipse cx="26" cy="42" rx="3" ry="4" fill="#7da359"/><ellipse cx="37" cy="42" rx="3" ry="4" fill="#7da359"/><path d="M24 55q8 4 16 0" stroke="#64814a" stroke-width="2" stroke-linecap="round"/></g>
    <g v-else><path d="m27 13-3-10 12 8 6-9 4 13" fill="#d5614d"/><path d="m9 35-8-5 4 13-3 8 12-6" fill="#704f40"/><circle cx="33" cy="34" r="27" fill="#ed7c64" stroke="#c66351" stroke-width="2"/><path d="M13 48c6-12 26-16 39-2-3 10-11 16-19 16-9 0-16-5-20-14Z" fill="#ffefd9"/><ellipse cx="28" cy="30" rx="7" ry="8" fill="#fffceb"/><ellipse cx="44" cy="30" rx="7" ry="8" fill="#fffceb"/><circle cx="31" cy="31" r="3" fill="#54463b"/><circle cx="42" cy="31" r="3" fill="#54463b"/><path d="m22 19 12 6m15-6-10 6" stroke="#644939" stroke-width="4" stroke-linecap="round"/><path d="m33 35 20 6-19 7Z" fill="#efba55" stroke="#c29346" stroke-width="1.5"/><ellipse cx="16" cy="39" rx="6" ry="4" fill="#dd6d58"/></g>
  </svg>
</template>
