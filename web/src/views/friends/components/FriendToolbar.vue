<script setup lang="ts">
defineProps<{
  friendCount: number
  blacklistedCount: number
}>()

const searchQuery = defineModel<string>('searchQuery', { required: true })
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-b border-b-solid px-4 py-2.5 a-border-b-border-sec"
  >
    <div class="flex items-center gap-2 text-sm a-color-text-tertiary">
      <span class="rounded-md px-2 py-0.5 font-medium a-color-primary-text a-bg-primary-bg">{{ friendCount }} 好友</span>
      <span
        v-if="blacklistedCount"
        class="rounded-md px-2 py-0.5 a-color-text-secondary a-bg-fill-secondary"
      >
        {{ blacklistedCount }} 屏蔽
      </span>
    </div>
    <a-input v-model:value="searchQuery" placeholder="搜索好友..." allow-clear class="!w-48">
      <template #prefix>
        <div class="i-twemoji-magnifying-glass-tilted-left text-base" />
      </template>
    </a-input>
  </div>
</template>
