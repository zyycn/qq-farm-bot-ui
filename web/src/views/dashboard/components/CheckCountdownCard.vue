<script setup lang="ts">
defineProps<{
  nextFarmCheck: string
  nextFriendCheck: string
}>()
</script>

<template>
  <a-card variant="borderless" :classes="{ body: '!p-4' }">
    <div class="mb-3 flex items-center gap-2 text-base font-medium a-color-text">
      <div class="i-twemoji-alarm-clock text-lg" />
      巡查倒计时
    </div>
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between rounded-lg px-3 py-2.5 a-bg-fill-tertiary">
        <div class="flex items-center gap-2">
          <div class="i-twemoji-seedling text-lg" />
          <span class="text-base a-color-text">农场</span>
        </div>
        <span class="text-base font-bold font-mono a-color-text">{{ nextFarmCheck }}</span>
      </div>
      <div class="flex items-center justify-between rounded-lg px-3 py-2.5 a-bg-fill-tertiary">
        <div class="flex items-center gap-2">
          <div class="i-twemoji-people-hugging text-lg" />
          <span class="text-base a-color-text">好友</span>
        </div>
        <span class="text-base font-bold font-mono a-color-text">{{ nextFriendCheck }}</span>
      </div>
    </div>
  </a-card>
</template>
