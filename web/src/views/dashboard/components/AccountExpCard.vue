<script setup lang="ts">
defineProps<{
  displayName: string
  level: number
  levelProgress?: { current: number; needed: number } | null
  expRate: string
  timeToLevel: string
  connected: boolean
}>()

function getExpPercent(p: { current: number; needed: number } | null | undefined): number {
  if (!p || !p.needed) return 0
  return Math.min(100, Math.max(0, (p.current / p.needed) * 100))
}
</script>

<template>
  <a-card variant="borderless" size="small" :classes="{ body: '!px-4 !py-3.5' }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="i-twemoji-farmer text-3xl" />
        <div class="min-w-0">
          <div class="truncate font-bold leading-snug a-color-text" :title="displayName">
            {{ displayName }}
          </div>
          <div class="a-color-text-secondary">Lv.{{ level || 0 }}</div>
        </div>
      </div>
      <a-badge :status="connected ? 'processing' : 'error'" :text="connected ? '在线' : '离线'" />
    </div>
    <div class="mt-4">
      <div class="mb-1 flex items-center justify-between a-color-text-secondary">
        <span class="flex items-center gap-1">
          <div class="i-twemoji-glowing-star" />
          经验
        </span>
        <span>{{ levelProgress?.current || 0 }} / {{ levelProgress?.needed || '?' }}</span>
      </div>
      <a-progress
        :percent="getExpPercent(levelProgress)"
        :show-info="false"
        size="small"
        stroke-color="var(--ant-color-primary)"
      />
      <div class="mt-1.5 flex items-center justify-between text-sm a-color-text-tertiary">
        <span>{{ expRate }}</span>
        <span>{{ timeToLevel }}</span>
      </div>
    </div>
  </a-card>
</template>
