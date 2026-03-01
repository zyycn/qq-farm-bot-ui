<script setup lang="ts">
import { BRAND_PLUS, BRAND_TITLE } from '../constants'

defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div
    class="brand-header h-12 flex shrink-0 items-center border-b border-b-solid a-border-b-border-sec"
    :class="collapsed ? 'justify-center px-2' : 'gap-2 px-4'"
  >
    <div class="brand-icon relative flex items-center justify-center">
      <img src="/icon.ico" alt="" class="h-8 w-8 shrink-0">
    </div>
    <template v-if="!collapsed">
      <span class="brand-title whitespace-nowrap text-lg font-bold tracking-wide font-serif">{{ BRAND_TITLE }}</span>
      <span class="brand-plus">{{ BRAND_PLUS }}</span>
      <span class="brand-sparkle text-xs">✦</span>
    </template>
  </div>
</template>

<style scoped>
.brand-title {
  background: linear-gradient(135deg, #15803d 0%, #22c55e 50%, #16a34a 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-plus {
  display: inline-flex;
  align-items: center;
  padding: 0 5px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  border-radius: 4px;
  background: linear-gradient(135deg, #15803d 0%, #22c55e 50%, #16a34a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(34, 197, 94, 0.3);
  color: #fff;
}

.brand-sparkle {
  color: #4ade80;
  animation: sparkle-pulse 2.4s ease-in-out infinite;
}

@keyframes sparkle-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-sparkle {
    animation: none;
    opacity: 0.6;
  }
}

:deep(.dark) .brand-title,
.dark .brand-title {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.dark) .brand-plus,
.dark .brand-plus {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(74, 222, 128, 0.3);
  color: #052e16;
}

:deep(.dark) .brand-sparkle,
.dark .brand-sparkle {
  color: #86efac;
}
</style>
