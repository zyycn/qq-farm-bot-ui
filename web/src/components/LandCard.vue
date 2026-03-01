<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  land: any
}>()

const land = computed(() => props.land)

const LAND_LEVEL_CLASS: Record<number, string> = {
  1: 'bg-yellow-1/80 border-yellow-2',
  2: 'bg-red-1/80 border-red-2',
  3: 'bg-slate-1 border-slate-300',
  4: 'bg-amber-1/80 border-amber-300',
}

const RING_HARVESTABLE = 'ring-2 ring-yellow-5 ring-offset-1'
const RING_STEALABLE = 'ring-2 ring-purple-5 ring-offset-1'

function getLandStatusClass(land: any) {
  const status = land.status
  const level = Number(land.level) || 0

  if (status === 'locked')
    return 'opacity-60 border-dashed'

  const baseClass = LAND_LEVEL_CLASS[level] || ''

  if (status === 'dead')
    return `${baseClass} grayscale`
  if (status === 'harvestable')
    return `${baseClass} ${RING_HARVESTABLE}`
  if (status === 'stealable')
    return `${baseClass} ${RING_STEALABLE}`
  return baseClass
}

function formatTime(sec: number) {
  if (sec <= 0)
    return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getSafeImageUrl(url: string) {
  if (!url)
    return ''
  if (url.startsWith('http://'))
    return url.replace('http://', 'https://')
  return url
}

function getLandTypeName(level: number) {
  const typeMap: Record<number, string> = { 0: '普通', 1: '黄土地', 2: '红土地', 3: '黑土地', 4: '金土地' }
  return typeMap[Number(level) || 0] || ''
}
</script>

<template>
  <a-card
    size="small"
    :classes="{ body: '!p-2 !flex !flex-col !items-center !min-h-[130px]' }"
    :class="getLandStatusClass(land)"
  >
    <span class="self-start text-xs font-mono a-color-text-tertiary">#{{ land.id }}</span>

    <div class="my-1 h-10 w-10 flex items-center justify-center">
      <img
        v-if="land.seedImage"
        :src="getSafeImageUrl(land.seedImage)"
        class="mb-0.5 max-h-full max-w-full object-contain"
        loading="lazy"
        referrerpolicy="no-referrer"
      >
      <div v-else class="i-carbon-sprout text-xl a-color-text-quat" />
    </div>

    <div class="w-full truncate px-1 text-center text-sm font-bold" :title="land.plantName">
      {{ land.plantName || '-' }}
    </div>

    <div class="mt-0.5 w-full text-center text-xs a-color-text-secondary">
      <span v-if="land.matureInSec > 0" class="a-color-warning">
        预计 {{ formatTime(land.matureInSec) }} 后成熟
      </span>
      <span v-else>
        {{ land.phaseName || (land.status === 'locked' ? '未解锁' : '未开垦') }}
      </span>
    </div>

    <div class="text-xs a-color-text-tertiary">
      {{ getLandTypeName(land.level) }}
    </div>

    <div class="mt-auto flex gap-0.5">
      <a-tag v-if="land.needWater" color="blue" class="!m-0 !px-1 !py-0 !text-xs !leading-tight">
        水
      </a-tag>
      <a-tag v-if="land.needWeed" color="green" class="!m-0 !px-1 !py-0 !text-xs !leading-tight">
        草
      </a-tag>
      <a-tag v-if="land.needBug" color="red" class="!m-0 !px-1 !py-0 !text-xs !leading-tight">
        虫
      </a-tag>
      <a-tag v-if="land.status === 'harvestable'" color="orange" class="!m-0 !px-1 !py-0 !text-xs !leading-tight">
        可偷
      </a-tag>
    </div>
  </a-card>
</template>
