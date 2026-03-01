<script setup lang="ts">
import type { Ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{
  collapsed?: boolean
  uptime: string
  formattedTime: Ref<string> | string
  version: string
  serverVersion: string
  connectionStatus: { text: string, badge: 'error' | 'default' | 'processing' }
}>()
</script>

<template>
  <div class="border-t border-t-solid px-3 py-3 a-border-t-border-sec">
    <template v-if="collapsed">
      <div class="flex flex-col items-center gap-2.5">
        <a-badge :status="connectionStatus.badge" />
        <ThemeToggle />
      </div>
    </template>
    <template v-else>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-sm a-color-text-tertiary">
          <div class="i-twemoji-timer-clock text-base" />
          {{ uptime }}
        </div>
        <ThemeToggle />
      </div>
      <div class="mt-1.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
        <span>{{ formattedTime }}</span>
      </div>
      <div class="mt-0.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
        <span>Web v{{ version }}</span>
        <span v-if="serverVersion">Core v{{ serverVersion }}</span>
      </div>
    </template>
  </div>
</template>
