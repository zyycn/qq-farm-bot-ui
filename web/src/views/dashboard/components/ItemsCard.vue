<script setup lang="ts">
defineProps<{
  fertilizerNormal: any
  fertilizerOrganic: any
  collectionNormal: any
  collectionRare: any
}>()

function formatBucketTime(item: any): string {
  if (!item) return '0.0h'
  if (item.hoursText) return item.hoursText.replace('小时', 'h')
  const count = Number(item.count || 0)
  return `${(count / 3600).toFixed(1)}h`
}
</script>

<template>
  <a-card variant="borderless" size="small" class="h-full" :classes="{ body: '!px-4 !py-3 !h-full' }">
    <div class="grid grid-cols-4 h-full gap-2">
      <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
        <div class="i-twemoji-droplet text-2xl" />
        <span class="text-center text-sm a-color-text-secondary">普通化肥</span>
        <span class="font-bold a-color-text">{{ formatBucketTime(fertilizerNormal) }}</span>
      </div>
      <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
        <div class="i-twemoji-herb text-2xl" />
        <span class="text-center text-sm a-color-text-secondary">有机化肥</span>
        <span class="font-bold a-color-text">{{ formatBucketTime(fertilizerOrganic) }}</span>
      </div>
      <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
        <div class="i-twemoji-four-leaf-clover text-2xl" />
        <span class="text-center text-sm a-color-text-secondary">普通收藏</span>
        <span class="font-bold a-color-text">{{ collectionNormal?.count || 0 }}</span>
      </div>
      <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
        <div class="i-twemoji-gem-stone text-2xl" />
        <span class="text-center text-sm a-color-text-secondary">典藏收藏</span>
        <span class="font-bold a-color-text">{{ collectionRare?.count || 0 }}</span>
      </div>
    </div>
  </a-card>
</template>
