<script setup lang="ts">
import QqAvatar from '@/components/QqAvatar.vue'

defineProps<{
  accountId: string | null
  accountName: string | null
  accountUin?: string | number
}>()
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!px-4 !py-3' }">
    <div v-if="accountId" class="flex items-center gap-4">
      <QqAvatar :uin="accountUin" :size="44" ring />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate font-bold a-color-text">{{ accountName }}</span>
        </div>
        <div class="mt-0.5 text-sm a-color-text-tertiary">UIN: {{ accountUin || '-' }}</div>
      </div>
    </div>
    <div v-else class="flex items-center gap-3 py-1">
      <div class="i-twemoji-gear text-2xl opacity-40" />
      <div>
        <div class="font-medium a-color-text-secondary">未选择账号</div>
        <div class="text-sm a-color-text-tertiary">请先在侧边栏选择一个账号来配置设置</div>
      </div>
    </div>
  </a-card>
</template>
