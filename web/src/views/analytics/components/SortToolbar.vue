<script setup lang="ts">
import { SORT_ICONS, SORT_OPTIONS } from '../constants'

defineProps<{
  totalCount: number
}>()
const sortKey = defineModel<string>('sortKey', { required: true })
const searchQuery = defineModel<string>('searchQuery', { required: true })
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-b border-b-solid px-4 py-2.5 a-border-b-border-sec"
  >
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1 rounded-lg p-0.5 a-bg-fill-tertiary">
        <a-button
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          type="text"
          class="rounded-md px-2.5 py-1 text-sm transition-all"
          :class="
            sortKey === opt.value
              ? 'a-bg-container a-color-primary-text font-semibold shadow-sm a-bg-primary-bg hover:!a-bg-primary-bg hover:!a-color-primary-text'
              : 'a-color-text-secondary'
          "
          @click="sortKey = opt.value"
        >
          <div class="text-base" :class="SORT_ICONS[opt.value]" />
          <span class="hidden sm:inline">{{ opt.label }}</span>
        </a-button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <a-input v-model:value="searchQuery" placeholder="搜索作物..." allow-clear class="!w-48">
        <template #prefix>
          <div class="i-twemoji-magnifying-glass-tilted-left text-sm" />
        </template>
      </a-input>
    </div>
  </div>
</template>
