<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useStatusStore } from '@/stores/status'
import DailyOverview from './DailyOverview.vue'

const statusStore = useStatusStore()
const accountStore = useAccountStore()
const { status, dailyGifts, realtimeConnected } = storeToRefs(statusStore)
const { currentAccountId, currentAccount } = storeToRefs(accountStore)

const growth = computed(() => dailyGifts.value?.growth || null)

async function refresh() {
  if (currentAccountId.value) {
    const acc = currentAccount.value
    if (!acc)
      return
    if (!realtimeConnected.value)
      await statusStore.fetchStatus(currentAccountId.value)
    if (acc.running && status.value?.connection?.connected)
      statusStore.fetchDailyGifts(currentAccountId.value)
  }
}

onMounted(() => refresh())
watch(currentAccountId, () => refresh())

function formatTaskProgress(task: any) {
  if (!task)
    return '未开始'
  const rawCurrent = task.progress ?? task.current
  const rawTarget = task.totalProgress ?? task.target
  const current = Number.isFinite(rawCurrent) ? rawCurrent : rawCurrent ? Number(rawCurrent) || 0 : 0
  const target = Number.isFinite(rawTarget) ? rawTarget : rawTarget ? Number(rawTarget) || 0 : 0
  if (!current && !target)
    return '未开始'
  if (target && current >= target)
    return '已完成'
  return `进度：${current}/${target}`
}
</script>

<template>
  <div class="space-y-4">
    <DailyOverview :daily-gifts="dailyGifts" />

    <a-card variant="borderless">
      <template #title>
        <div class="flex items-center gap-2">
          <div class="i-carbon-growth a-color-success" />
          <span>成长任务</span>
        </div>
      </template>
      <template #extra>
        <a-tag v-if="growth" :color="growth.doneToday ? 'green' : 'blue'" size="small">
          {{ growth.doneToday ? '今日已完成' : `${growth.completedCount}/${growth.totalCount}` }}
        </a-tag>
      </template>

      <a-empty v-if="!currentAccountId" description="请选择账号查看任务详情" />
      <a-empty v-else-if="!status?.connection?.connected" description="账号未登录，请先运行账号" />
      <div v-else-if="growth && growth.tasks && growth.tasks.length" class="space-y-2">
        <div v-for="(task, idx) in growth.tasks" :key="idx" class="flex items-center justify-between text-base">
          <span class="a-color-text-secondary">{{ task.desc || task.name }}</span>
          <a-tag :color="formatTaskProgress(task) === '已完成' ? 'green' : 'default'" size="small">
            {{ formatTaskProgress(task) }}
          </a-tag>
        </div>
      </div>
      <a-empty v-else description="暂无任务详情" :image-style="{ height: '40px' }" />
    </a-card>
  </div>
</template>
