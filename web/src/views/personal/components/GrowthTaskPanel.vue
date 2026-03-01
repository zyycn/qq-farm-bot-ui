<script setup lang="ts">
defineProps<{
  growth: { doneToday?: boolean, completedCount?: number, totalCount?: number, tasks?: any[] } | null
}>()

function formatTaskProgress(task: any) {
  if (!task)
    return '未开始'
  const current = Number(task.progress ?? task.current) || 0
  const target = Number(task.totalProgress ?? task.target) || 0
  if (!current && !target)
    return '未开始'
  if (target && current >= target)
    return '已完成'
  return `${current}/${target}`
}
</script>

<template>
  <a-card variant="borderless" size="small" :classes="{ body: '!p-3' }">
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-base font-bold a-color-text">
        <div class="i-twemoji-check-mark-button text-base" />
        成长任务
      </div>
      <a-tag v-if="growth" :color="growth.doneToday ? 'green' : 'blue'" size="small">
        {{ growth.doneToday ? '已完成' : `${growth.completedCount}/${growth.totalCount}` }}
      </a-tag>
    </div>
    <a-empty v-if="!growth?.tasks?.length" description="暂无任务" :image-style="{ height: '32px' }" />
    <div v-else class="space-y-1">
      <div
        v-for="(task, idx) in growth.tasks"
        :key="idx"
        class="flex items-center justify-between rounded-lg px-2.5 py-1.5 a-bg-fill-tertiary"
      >
        <span class="truncate text-sm a-color-text-secondary">{{ task.desc || task.name }}</span>
        <a-tag
          :color="formatTaskProgress(task) === '已完成' ? 'green' : 'default'"
          size="small"
          class="shrink-0 !ml-2"
        >
          {{ formatTaskProgress(task) }}
        </a-tag>
      </div>
    </div>
  </a-card>
</template>
