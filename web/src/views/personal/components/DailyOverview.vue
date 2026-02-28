<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dailyGifts: any
}>()

const GIFT_ICONS: Record<string, string> = {
  task_claim: 'i-carbon-task-complete',
  email_rewards: 'i-carbon-email',
  mall_free_gifts: 'i-carbon-shopping-bag',
  daily_share: 'i-carbon-share',
  vip_daily_gift: 'i-carbon-star',
  month_card_gift: 'i-carbon-calendar',
  open_server_gift: 'i-carbon-gift',
}

function getGiftIcon(key: string) {
  return GIFT_ICONS[key] || 'i-carbon-gift'
}

const hasDailyData = computed(() => !!props.dailyGifts)
const gifts = computed(() => props.dailyGifts?.gifts || [])

function formatTime(timestamp: number) {
  if (!timestamp)
    return '未领取'
  const d = new Date(timestamp)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getGiftStatusText(gift: any) {
  if (!gift)
    return '未知'
  if (gift.key === 'vip_daily_gift' && gift.hasGift === false)
    return '未开通'
  if (gift.key === 'month_card_gift' && gift.hasCard === false)
    return '未开通'
  if (gift.doneToday)
    return '今日已完成'
  if (gift.enabled)
    return '等待执行'
  return '未开启'
}

function getGiftStatusColor(gift: any): string {
  if (!gift)
    return 'default'
  if (gift.doneToday)
    return 'green'
  if (gift.enabled)
    return 'blue'
  return 'default'
}

function formatGiftSubText(gift: any) {
  if (!gift)
    return ''
  if (gift.key === 'vip_daily_gift' && gift.hasGift === false)
    return '未开通QQ会员或无每日礼包'
  if (gift.key === 'month_card_gift' && gift.hasCard === false)
    return '未购买月卡或已过期'
  const ts = Number(gift.lastAt || 0)
  if (!ts)
    return ''
  if (gift.doneToday)
    return `完成时间 ${formatTime(ts)}`
  if (gift.enabled)
    return `上次执行 ${formatTime(ts)}`
  return `上次检测 ${formatTime(ts)}`
}

function formatGiftProgress(gift: any) {
  if (!gift)
    return ''
  const total = Number(gift.totalCount || 0)
  const current = Number(gift.completedCount || 0)
  if (!total)
    return ''
  return `${current}/${total}`
}
</script>

<template>
  <a-card variant="borderless">
    <template #title>
      <div class="flex items-center gap-2">
        <div class="i-carbon-gift a-color-error" />
        <span>每日礼包 & 任务</span>
      </div>
    </template>

    <a-empty v-if="!hasDailyData" description="请登录账号后查看" />
    <a-empty v-else-if="!gifts.length" description="暂无每日礼包与任务数据" />

    <div v-else class="grid grid-cols-2 gap-3 2xl:grid-cols-3 sm:grid-cols-3">
      <a-card v-for="gift in gifts" :key="gift.key" size="small" :classes="{ body: '!p-3' }">
        <div class="mb-2 flex items-center gap-2">
          <div
            class="h-7 w-7 flex flex-shrink-0 items-center justify-center rounded-md"
            :style="{
              background: gift.doneToday ? 'var(--ant-color-primary-bg)' : gift.enabled ? 'var(--ant-color-fill-tertiary)' : 'var(--ant-color-fill-tertiary)',
            }"
          >
            <div
              :class="getGiftIcon(gift.key)"
              :style="{
                color: gift.doneToday ? 'var(--ant-color-success)' : gift.enabled ? 'var(--ant-color-info)' : 'var(--ant-color-text-tertiary)',
              }"
            />
          </div>
          <span class="text-base font-medium leading-tight a-color-text">
            {{ gift.label }}
          </span>
        </div>

        <div class="flex items-end justify-between">
          <a-tag :color="getGiftStatusColor(gift)" size="small">
            {{ getGiftStatusText(gift) }}
          </a-tag>
          <div class="flex flex-col items-end">
            <span v-if="formatGiftProgress(gift)" class="text-sm font-bold a-color-text">
              {{ formatGiftProgress(gift) }}
            </span>
            <span v-if="formatGiftSubText(gift)" class="mt-0.5 text-xs a-color-text-tertiary">
              {{ formatGiftSubText(gift) }}
            </span>
          </div>
        </div>
      </a-card>
    </div>
  </a-card>
</template>
