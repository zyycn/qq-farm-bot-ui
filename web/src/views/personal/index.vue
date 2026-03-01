<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import LandCard from '@/components/LandCard.vue'
import { useAccountStore } from '@/stores/account'
import { useBagStore } from '@/stores/bag'
import { useFarmStore } from '@/stores/farm'
import { useStatusStore } from '@/stores/status'

const farmStore = useFarmStore()
const accountStore = useAccountStore()
const statusStore = useStatusStore()
const bagStore = useBagStore()

const { lands, summary, loading: farmLoading } = storeToRefs(farmStore)
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { status, dailyGifts, loading: statusLoading, realtimeConnected } = storeToRefs(statusStore)
const { items: bagItems, loading: bagLoading } = storeToRefs(bagStore)

const operating = ref(false)
const confirmVisible = ref(false)
const confirmConfig = ref({ title: '', message: '', opType: '' })
const imageErrors = ref<Record<string | number, boolean>>({})

const connected = computed(() => status.value?.connection?.connected)
const growth = computed(() => dailyGifts.value?.growth || null)
const gifts = computed(() => dailyGifts.value?.gifts || [])

const operations = [
  { type: 'harvest', label: '收获', icon: 'i-twemoji-sheaf-of-rice' },
  { type: 'clear', label: '除草', icon: 'i-twemoji-herb' },
  { type: 'plant', label: '种植', icon: 'i-twemoji-seedling' },
  { type: 'upgrade', label: '升级', icon: 'i-twemoji-building-construction' },
  { type: 'all', label: '全收', icon: 'i-twemoji-sparkles' },
]

const GIFT_ICONS: Record<string, string> = {
  task_claim: 'i-twemoji-check-mark-button',
  email_rewards: 'i-twemoji-envelope',
  mall_free_gifts: 'i-twemoji-shopping-bags',
  daily_share: 'i-twemoji-loudspeaker',
  vip_daily_gift: 'i-twemoji-crown',
  month_card_gift: 'i-twemoji-calendar',
  open_server_gift: 'i-twemoji-wrapped-gift',
}

function getGiftIcon(key: string) {
  return GIFT_ICONS[key] || 'i-twemoji-wrapped-gift'
}

function getGiftStatus(gift: any) {
  if (gift.key === 'vip_daily_gift' && gift.hasGift === false)
    return { text: '未开通', color: 'default' as const }
  if (gift.key === 'month_card_gift' && gift.hasCard === false)
    return { text: '未开通', color: 'default' as const }
  if (gift.doneToday)
    return { text: '已完成', color: 'green' as const }
  if (gift.enabled)
    return { text: '等待中', color: 'blue' as const }
  return { text: '未开启', color: 'default' as const }
}

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

async function executeOperate() {
  if (!currentAccountId.value || !confirmConfig.value.opType)
    return
  confirmVisible.value = false
  operating.value = true
  try {
    await farmStore.operate(currentAccountId.value, confirmConfig.value.opType)
  }
  finally {
    operating.value = false
  }
}

function handleOperate(opType: string) {
  if (!currentAccountId.value)
    return
  const msgs: Record<string, string> = {
    harvest: '确定要收获所有成熟作物吗？',
    clear: '确定要一键除草/除虫吗？',
    plant: '确定要一键种植吗？',
    upgrade: '确定要升级所有可升级的土地吗？',
    all: '确定要一键全收吗？',
  }
  confirmConfig.value = { title: '确认操作', message: msgs[opType] || '确定执行此操作吗？', opType }
  confirmVisible.value = true
}

async function refresh() {
  if (!currentAccountId.value)
    return
  let acc = currentAccount.value
  if (!acc) {
    await accountStore.fetchAccounts()
    acc = currentAccount.value
  }
  if (!acc)
    return
  if (!realtimeConnected.value)
    await statusStore.fetchStatus(currentAccountId.value)
  if (acc.running && connected.value) {
    farmStore.fetchLands(currentAccountId.value)
    bagStore.fetchBag(currentAccountId.value)
    statusStore.fetchDailyGifts(currentAccountId.value)
  }
}

watch(currentAccountId, () => {
  imageErrors.value = {}
  refresh()
})

const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(() => {
  if (lands.value) {
    lands.value = lands.value.map((l: any) => (l.matureInSec > 0 ? { ...l, matureInSec: l.matureInSec - 1 } : l))
  }
}, 1000)

const { pause: pauseRefresh, resume: resumeRefresh } = useIntervalFn(refresh, 60000)

onMounted(() => {
  refresh()
  resumeCountdown()
  resumeRefresh()
})

onUnmounted(() => {
  pauseCountdown()
  pauseRefresh()
})
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- Farm Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2 text-base font-bold a-color-text">
        <div class="i-twemoji-ear-of-corn text-lg" />
        我的农场
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 gap-3 overflow-hidden">
      <!-- Left: Land Grid -->
      <a-card variant="borderless" class="flex-1 overflow-hidden" :classes="{ body: '!p-0 !h-full !flex !flex-col' }">
        <!-- Stats bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-b-solid px-3 py-2 a-border-b-border-sec">
          <div class="min-w-0 flex shrink flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 a-bg-fill-tertiary">
              <div class="i-twemoji-sheaf-of-rice text-base" />
              <span class="text-sm a-color-text-secondary">可收</span>
              <span class="text-base font-bold a-color-text">{{ summary?.harvestable || 0 }}</span>
            </div>
            <div class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 a-bg-fill-tertiary">
              <div class="i-twemoji-seedling text-base" />
              <span class="text-sm a-color-text-secondary">生长</span>
              <span class="text-base font-bold a-color-text">{{ summary?.growing || 0 }}</span>
            </div>
            <div class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 a-bg-fill-tertiary">
              <span class="text-sm a-color-text-secondary">空闲</span>
              <span class="text-base font-bold a-color-text">{{ summary?.empty || 0 }}</span>
            </div>
            <div
              v-if="(summary?.dead || 0) > 0"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 a-bg-fill-tertiary"
            >
              <span class="text-sm a-color-text-secondary">枯萎</span>
              <span class="text-base font-bold a-color-error">{{ summary?.dead || 0 }}</span>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <a-tooltip v-for="op in operations" :key="op.type" :title="op.label" placement="bottom">
              <a-button
                :disabled="operating || !connected"
                :type="op.type === 'all' ? 'primary' : 'default'"
                size="small"
                class="h-7!"
                @click="handleOperate(op.type)"
              >
                <template #icon>
                  <div class="text-base" :class="op.icon" />
                </template>
                <span class="hidden sm:inline">{{ op.label }}</span>
              </a-button>
            </a-tooltip>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <a-spin :spinning="farmLoading || statusLoading">
            <a-empty v-if="!connected" description="账号未连接" class="pt-12" />
            <a-empty v-else-if="!lands || lands.length === 0" description="暂无土地数据" class="pt-12" />
            <div v-else class="grid grid-cols-2 gap-2.5 lg:grid-cols-4 md:grid-cols-3 xl:grid-cols-5">
              <LandCard v-for="land in lands" :key="land.id" :land="land" />
            </div>
          </a-spin>
        </div>
      </a-card>

      <!-- Right: Tasks + Bag -->
      <div class="hidden w-72 shrink-0 flex-col gap-3 overflow-hidden xl:w-80 md:flex">
        <!-- Daily Gifts -->
        <a-card variant="borderless" size="small" :classes="{ body: '!p-3' }">
          <div class="mb-2 flex items-center gap-2 text-base font-bold a-color-text">
            <div class="i-twemoji-wrapped-gift text-base" />
            每日礼包
          </div>
          <a-empty v-if="!gifts.length" description="暂无数据" :image-style="{ height: '32px' }" />
          <div v-else class="grid grid-cols-2 gap-1.5">
            <div
              v-for="gift in gifts"
              :key="gift.key"
              class="flex items-center gap-2 rounded-lg px-2 py-1.5"
              :class="gift.doneToday ? 'a-bg-primary-bg' : 'a-bg-fill-tertiary'"
            >
              <div class="shrink-0 text-base" :class="getGiftIcon(gift.key)" />
              <div class="min-w-0 flex-1">
                <div class="mb-0.5 truncate text-sm font-medium leading-tight a-color-text">
                  {{ gift.label }}
                </div>
                <div class="text-sm" :class="gift.doneToday ? 'a-color-success' : 'a-color-text-tertiary'">
                  {{ getGiftStatus(gift).text }}
                </div>
              </div>
            </div>
          </div>
        </a-card>

        <!-- Growth Tasks -->
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

        <!-- Bag -->
        <a-card
          variant="borderless"
          size="small"
          class="flex-1 overflow-hidden"
          :classes="{ body: '!p-3 !h-full !flex !flex-col !overflow-hidden' }"
        >
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2 text-base font-bold a-color-text">
              <div class="i-twemoji-backpack text-base" />
              背包
            </div>
            <span v-if="bagItems.length" class="text-sm a-color-text-tertiary">{{ bagItems.length }} 种</span>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <a-spin v-if="bagLoading" class="items-center justify-center py-4 !flex" />
            <a-empty v-else-if="!bagItems.length" description="背包空空" :image-style="{ height: '32px' }" />
            <div v-else class="space-y-1">
              <div
                v-for="item in bagItems"
                :key="item.id"
                class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 a-bg-fill-tertiary"
              >
                <div
                  class="h-8 w-8 flex shrink-0 items-center justify-center overflow-hidden rounded-lg a-bg-container"
                >
                  <img
                    v-if="item.image && !imageErrors[item.id]"
                    :src="item.image"
                    class="h-6 w-6 object-contain"
                    loading="lazy"
                    @error="imageErrors[item.id] = true"
                  >
                  <span v-else class="text-sm font-bold a-color-text-tertiary">{{
                    (item.name || '物').slice(0, 1)
                  }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium leading-tight a-color-text">
                    {{ item.name || `物品${item.id}` }}
                  </div>
                  <div class="text-xs a-color-text-tertiary">
                    {{ item.hoursText || `x${item.count || 0}` }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- Mobile sections -->
    <div class="flex flex-col gap-3 md:hidden">
      <a-card variant="borderless" size="small" :classes="{ body: '!p-3' }">
        <div class="mb-2 flex items-center gap-2 text-base font-bold a-color-text">
          <div class="i-twemoji-wrapped-gift text-base" />
          每日礼包
        </div>
        <div v-if="gifts.length" class="grid grid-cols-2 gap-1.5">
          <div
            v-for="gift in gifts"
            :key="gift.key"
            class="flex items-center gap-2 rounded-lg px-2 py-1.5"
            :class="gift.doneToday ? 'a-bg-primary-bg' : 'a-bg-fill-tertiary'"
          >
            <div class="shrink-0 text-base" :class="getGiftIcon(gift.key)" />
            <div class="min-w-0">
              <div class="truncate text-sm font-medium a-color-text">
                {{ gift.label }}
              </div>
              <div class="text-xs" :class="gift.doneToday ? 'a-color-success' : 'a-color-text-tertiary'">
                {{ getGiftStatus(gift).text }}
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <ConfirmModal
      :show="confirmVisible"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      @confirm="executeOperate"
      @cancel="confirmVisible = false"
    />
  </div>
</template>
