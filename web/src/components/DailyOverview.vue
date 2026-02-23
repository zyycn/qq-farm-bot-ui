<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dailyGifts: any
}>()

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
  return `进度：${current}/${total}`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Daily Gifts Grid -->
    <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h3 class="mb-3 flex items-center gap-2 font-medium">
        <div class="i-carbon-gift text-pink-500" />
        <span>每日礼包 & 任务</span>
      </h3>

      <div
        v-if="!hasDailyData"
        class="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400"
      >
        请登录账号后查看
      </div>
      <div
        v-else-if="!gifts.length"
        class="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400"
      >
        暂无每日礼包与任务数据
      </div>
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div
          v-for="gift in gifts"
          :key="gift.key"
          class="flex flex-col justify-between border border-gray-100 rounded p-2 dark:border-gray-700"
        >
          <div class="mb-1 text-sm text-gray-700 font-medium dark:text-gray-300">
            {{ gift.label }}
          </div>

          <div class="flex items-end justify-between">
            <div class="flex flex-col">
              <span
                class="text-xs"
                :class="gift.doneToday ? 'text-green-500' : (gift.enabled ? 'text-blue-500' : 'text-gray-400')"
              >
                {{ getGiftStatusText(gift) }}
              </span>
            </div>

            <div class="flex flex-col items-end">
              <span v-if="formatGiftProgress(gift)" class="text-xs text-gray-500 font-bold">
                {{ formatGiftProgress(gift) }}
              </span>
              <span
                v-if="formatGiftSubText(gift)"
                class="mt-0.5 text-[10px] text-gray-400"
              >
                {{ formatGiftSubText(gift) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
