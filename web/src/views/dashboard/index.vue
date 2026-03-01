<script setup lang="ts">
import { SearchOutlined } from '@antdv-next/icons'
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useBagStore } from '@/stores/bag'
import { useStatusStore } from '@/stores/status'

const statusStore = useStatusStore()
const accountStore = useAccountStore()
const bagStore = useBagStore()
const { status, logs: statusLogs, accountLogs: statusAccountLogs, realtimeConnected } = storeToRefs(statusStore)
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { dashboardItems } = storeToRefs(bagStore)
const logContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const lastBagFetchAt = ref(0)

const allLogs = computed(() => {
  const sLogs = statusLogs.value || []
  const aLogs = (statusAccountLogs.value || []).map((l: any) => ({
    ts: new Date(l.time).getTime(),
    time: l.time,
    tag: l.action === 'Error' ? '错误' : '系统',
    msg: l.reason ? `${l.msg} (${l.reason})` : l.msg,
    isAccountLog: true,
  }))

  return [...sLogs, ...aLogs].sort((a: any, b: any) => a.ts - b.ts).filter((l: any) => !l.isAccountLog)
})

const filter = reactive({
  module: '',
  event: '',
  keyword: '',
  isWarn: '',
})

const hasActiveLogFilter = computed(() => !!(filter.module || filter.event || filter.keyword || filter.isWarn))

const modules = [
  { label: '所有模块', value: '' },
  { label: '农场', value: 'farm' },
  { label: '好友', value: 'friend' },
  { label: '仓库', value: 'warehouse' },
  { label: '任务', value: 'task' },
  { label: '系统', value: 'system' },
]

const events = [
  { label: '所有事件', value: '' },
  { label: '农场巡查', value: 'farm_cycle' },
  { label: '收获作物', value: 'harvest_crop' },
  { label: '清理枯株', value: 'remove_plant' },
  { label: '种植种子', value: 'plant_seed' },
  { label: '施加化肥', value: 'fertilize' },
  { label: '土地推送', value: 'lands_notify' },
  { label: '选择种子', value: 'seed_pick' },
  { label: '购买种子', value: 'seed_buy' },
  { label: '购买化肥', value: 'fertilizer_buy' },
  { label: '开启礼包', value: 'fertilizer_gift_open' },
  { label: '获取任务', value: 'task_scan' },
  { label: '完成任务', value: 'task_claim' },
  { label: '免费礼包', value: 'mall_free_gifts' },
  { label: '分享奖励', value: 'daily_share' },
  { label: '会员礼包', value: 'vip_daily_gift' },
  { label: '月卡礼包', value: 'month_card_gift' },
  { label: '开服红包', value: 'open_server_gift' },
  { label: '图鉴奖励', value: 'illustrated_rewards' },
  { label: '邮箱领取', value: 'email_rewards' },
  { label: '出售成功', value: 'sell_success' },
  { label: '土地升级', value: 'upgrade_land' },
  { label: '土地解锁', value: 'unlock_land' },
  { label: '好友巡查', value: 'friend_cycle' },
  { label: '访问好友', value: 'visit_friend' },
]

const eventLabelMap: Record<string, string> = Object.fromEntries(
  events.filter(e => e.value).map(e => [e.value, e.label]),
)

function getEventLabel(event: string) {
  return eventLabelMap[event] || event
}

const logLevels = [
  { label: '所有等级', value: '' },
  { label: '普通', value: 'info' },
  { label: '警告', value: 'warn' },
]

const displayName = computed(() => {
  const account = accountStore.currentAccount
  const gameName = status.value?.status?.name
  if (gameName) {
    if (account?.name)
      return `${gameName} (${account.name})`
    return gameName
  }

  if (!status.value?.connection?.connected) {
    if (account) {
      if (account.name && account.nick)
        return `${account.nick} (${account.name})`
      return account.name || account.nick || '未登录'
    }
    return '未登录'
  }

  if (account) {
    if (account.name && account.nick)
      return `${account.nick} (${account.name})`
    return account.name || account.nick || '未命名'
  }
  return '未命名'
})

const expRate = computed(() => {
  const gain = status.value?.sessionExpGained || 0
  const uptime = status.value?.uptime || 0
  if (!uptime)
    return '0/时'
  const hours = uptime / 3600
  const rate = hours > 0 ? gain / hours : 0
  return `${Math.floor(rate)}/时`
})

const timeToLevel = computed(() => {
  const gain = status.value?.sessionExpGained || 0
  const uptime = status.value?.uptime || 0
  const current = status.value?.levelProgress?.current || 0
  const needed = status.value?.levelProgress?.needed || 0

  if (!needed || !uptime || gain <= 0)
    return ''

  const hours = uptime / 3600
  const ratePerHour = hours > 0 ? gain / hours : 0
  if (ratePerHour <= 0)
    return ''

  const expNeeded = needed - current
  const minsToLevel = expNeeded / (ratePerHour / 60)

  if (minsToLevel < 60)
    return `约 ${Math.ceil(minsToLevel)} 分钟后升级`
  return `约 ${(minsToLevel / 60).toFixed(1)} 小时后升级`
})

const fertilizerNormal = computed(() => dashboardItems.value.find((i: any) => Number(i.id) === 1011))
const fertilizerOrganic = computed(() => dashboardItems.value.find((i: any) => Number(i.id) === 1012))
const collectionNormal = computed(() => dashboardItems.value.find((i: any) => Number(i.id) === 3001))
const collectionRare = computed(() => dashboardItems.value.find((i: any) => Number(i.id) === 3002))

function formatBucketTime(item: any) {
  if (!item)
    return '0.0h'
  if (item.hoursText)
    return item.hoursText.replace('小时', 'h')
  const count = Number(item.count || 0)
  return `${(count / 3600).toFixed(1)}h`
}

const nextFarmCheck = ref('--')
const nextFriendCheck = ref('--')
const localUptime = ref(0)
let localNextFarmRemainSec = 0
let localNextFriendRemainSec = 0

function updateCountdowns() {
  if (status.value?.connection?.connected) {
    localUptime.value++
  }

  if (localNextFarmRemainSec > 0) {
    localNextFarmRemainSec--
    nextFarmCheck.value = formatDuration(localNextFarmRemainSec)
  }
  else {
    nextFarmCheck.value = '巡查中...'
  }

  if (localNextFriendRemainSec > 0) {
    localNextFriendRemainSec--
    nextFriendCheck.value = formatDuration(localNextFriendRemainSec)
  }
  else {
    nextFriendCheck.value = '巡查中...'
  }
}

watch(
  status,
  (newVal) => {
    if (newVal?.nextChecks) {
      localNextFarmRemainSec = newVal.nextChecks.farmRemainSec || 0
      localNextFriendRemainSec = newVal.nextChecks.friendRemainSec || 0
      updateCountdowns()
    }
    if (newVal?.uptime !== undefined) {
      localUptime.value = newVal.uptime
    }
  },
  { deep: true },
)

function formatDuration(seconds: number) {
  if (seconds <= 0)
    return '00:00:00'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (d > 0)
    return `${d}天 ${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function formatLogTime(timeStr: string) {
  if (!timeStr)
    return ''
  const parts = timeStr.split(' ')
  return parts.length > 1 ? parts[1] : timeStr
}

const OP_META: Record<string, { label: string, icon: string }> = {
  harvest: { label: '收获', icon: 'i-twemoji-sheaf-of-rice' },
  water: { label: '浇水', icon: 'i-twemoji-droplet' },
  weed: { label: '除草', icon: 'i-twemoji-herb' },
  bug: { label: '除虫', icon: 'i-twemoji-bug' },
  fertilize: { label: '施肥', icon: 'i-twemoji-test-tube' },
  plant: { label: '种植', icon: 'i-twemoji-seedling' },
  upgrade: { label: '土地升级', icon: 'i-twemoji-building-construction' },
  levelUp: { label: '账号升级', icon: 'i-twemoji-star' },
  steal: { label: '偷菜', icon: 'i-twemoji-ninja' },
  helpWater: { label: '帮浇水', icon: 'i-twemoji-sweat-droplets' },
  helpWeed: { label: '帮除草', icon: 'i-twemoji-four-leaf-clover' },
  helpBug: { label: '帮除虫', icon: 'i-twemoji-lady-beetle' },
  taskClaim: { label: '任务', icon: 'i-twemoji-check-mark-button' },
  sell: { label: '出售', icon: 'i-twemoji-coin' },
}

function getOpName(key: string | number) {
  return OP_META[String(key)]?.label || String(key)
}

function getOpIcon(key: string | number) {
  return OP_META[String(key)]?.icon || 'i-twemoji-seedling'
}

function getExpPercent(p: any) {
  if (!p || !p.needed)
    return 0
  return Math.min(100, Math.max(0, (p.current / p.needed) * 100))
}

async function refreshBag(force = false) {
  if (!currentAccountId.value)
    return
  if (!currentAccount.value?.running)
    return
  if (!status.value?.connection?.connected)
    return

  const now = Date.now()
  if (!force && now - lastBagFetchAt.value < 2500)
    return
  lastBagFetchAt.value = now
  await bagStore.fetchBag(currentAccountId.value)
}

async function refresh(forceReloadLogs = false) {
  if (currentAccountId.value) {
    const acc = currentAccount.value
    if (!acc)
      return

    // 首次加载、断线兜底时走 HTTP；连接正常时优先走 WS 实时推送
    if (!realtimeConnected.value) {
      await statusStore.fetchStatus(currentAccountId.value)
      await statusStore.fetchAccountLogs()
    }

    if (forceReloadLogs || hasActiveLogFilter.value || !realtimeConnected.value) {
      await statusStore.fetchLogs(currentAccountId.value, {
        module: filter.module || undefined,
        event: filter.event || undefined,
        keyword: filter.keyword || undefined,
        isWarn: filter.isWarn === 'warn' ? true : filter.isWarn === 'info' ? false : undefined,
      })
    }

    // 仅在账号已运行且连接就绪后拉背包，避免启动阶段触发500
    await refreshBag()
  }
}

function onLogFilterChange() {
  refresh(true)
}

function onLogSearchTrigger() {
  refresh(true)
}

watch(currentAccountId, () => {
  refresh()
})

watch(
  () => status.value?.connection?.connected,
  (connected) => {
    if (connected)
      refreshBag(true)
  },
)

watch(
  () => JSON.stringify(status.value?.operations || {}),
  (next, prev) => {
    if (!realtimeConnected.value || next === prev)
      return
    refreshBag()
  },
)

watch(hasActiveLogFilter, (enabled) => {
  statusStore.setRealtimeLogsEnabled(!enabled)
  refresh(enabled)
})

watch(currentAccountId, () => {
  refresh()
})

watch(
  () => status.value?.connection?.connected,
  (connected) => {
    if (connected)
      refreshBag(true)
  },
)

watch(
  () => JSON.stringify(status.value?.operations || {}),
  (next, prev) => {
    if (!realtimeConnected.value || next === prev)
      return
    refreshBag()
  },
)

watch(hasActiveLogFilter, (enabled) => {
  statusStore.setRealtimeLogsEnabled(!enabled)
  refresh()
})

function onLogScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el)
    return
  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  autoScroll.value = isNearBottom
}

function scrollLogsToBottom(force = false) {
  nextTick(() => {
    if (!logContainer.value)
      return
    if (!force && !autoScroll.value)
      return
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  })
}

watch(
  allLogs,
  () => {
    scrollLogsToBottom()
  },
  { deep: true },
)

onMounted(() => {
  statusStore.setRealtimeLogsEnabled(!hasActiveLogFilter.value)
  refresh()
  autoScroll.value = true
  scrollLogsToBottom(true)
})

useIntervalFn(refresh, 10000)
useIntervalFn(updateCountdowns, 1000)
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- Status Cards -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <!-- Account & Exp -->
      <a-card variant="borderless" size="small" :classes="{ body: '!px-4 !py-3.5' }">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="i-twemoji-farmer text-3xl" />
            <div class="min-w-0">
              <div class="truncate text-base font-bold leading-snug a-color-text" :title="displayName">
                {{ displayName }}
              </div>
              <div class="text-base a-color-text-secondary">
                Lv.{{ status?.status?.level || 0 }}
              </div>
            </div>
          </div>
          <a-badge
            :status="status?.connection?.connected ? 'processing' : 'error'"
            :text="status?.connection?.connected ? '在线' : '离线'"
          />
        </div>
        <div class="mt-4">
          <div class="mb-1 flex items-center justify-between text-base a-color-text-secondary">
            <span class="flex items-center gap-1">
              <div class="i-twemoji-glowing-star text-base" />
              经验
            </span>
            <span>{{ status?.levelProgress?.current || 0 }} / {{ status?.levelProgress?.needed || '?' }}</span>
          </div>
          <a-progress
            :percent="getExpPercent(status?.levelProgress)"
            :show-info="false"
            size="small"
            stroke-color="var(--ant-color-primary)"
          />
          <div class="mt-1.5 flex items-center justify-between text-sm a-color-text-tertiary">
            <span>{{ expRate }}</span>
            <span>{{ timeToLevel }}</span>
          </div>
        </div>
      </a-card>

      <!-- Assets -->
      <a-card
        variant="borderless"
        size="small"
        class="h-full"
        :classes="{ body: '!px-4 !py-3 !h-full !flex !flex-col !min-h-0' }"
      >
        <div class="grid grid-cols-2 min-h-0 flex-1 gap-3">
          <div class="flex flex-col items-center justify-center rounded-lg p-3 a-bg-fill-tertiary">
            <div class="flex items-center gap-1.5 text-base a-color-text-secondary">
              <div class="i-twemoji-coin text-base" />
              金币
            </div>
            <div class="mt-1.5 text-xl font-bold a-color-text">
              {{ status?.status?.gold || 0 }}
            </div>
            <div
              v-if="(status?.sessionGoldGained || 0) !== 0"
              class="mt-0.5 flex items-center justify-center gap-0.5 text-base"
              :class="(status?.sessionGoldGained || 0) > 0 ? 'a-color-success' : 'a-color-error'"
            >
              <span class="font-bold">{{ (status?.sessionGoldGained || 0) > 0 ? '↑' : '↓' }}</span>
              <span>{{ Math.abs(status?.sessionGoldGained || 0) }}</span>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center rounded-lg p-3 a-bg-fill-tertiary">
            <div class="flex items-center gap-1.5 text-base a-color-text-secondary">
              <div class="i-twemoji-ticket text-base" />
              点券
            </div>
            <div class="mt-1.5 text-xl font-bold a-color-text">
              {{ status?.status?.coupon || 0 }}
            </div>
            <div
              v-if="(status?.sessionCouponGained || 0) !== 0"
              class="mt-0.5 flex items-center justify-center gap-0.5 text-base"
              :class="(status?.sessionCouponGained || 0) > 0 ? 'a-color-success' : 'a-color-error'"
            >
              <span class="font-bold">{{ (status?.sessionCouponGained || 0) > 0 ? '↑' : '↓' }}</span>
              <span>{{ Math.abs(status?.sessionCouponGained || 0) }}</span>
            </div>
          </div>
          <div class="col-span-2 flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 a-bg-fill-tertiary">
            <div class="i-twemoji-stopwatch text-lg" />
            <span class="text-base a-color-text-secondary">挂机时长</span>
            <span class="text-base font-bold font-mono a-color-primary-text">{{ formatDuration(localUptime) }}</span>
          </div>
        </div>
      </a-card>

      <!-- Items -->
      <a-card variant="borderless" size="small" class="h-full" :classes="{ body: '!px-4 !py-3 !h-full' }">
        <div class="grid grid-cols-4 h-full gap-2">
          <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
            <div class="i-twemoji-droplet text-2xl" />
            <span class="text-center text-sm a-color-text-secondary">普通化肥</span>
            <span class="text-base font-bold a-color-text">{{ formatBucketTime(fertilizerNormal) }}</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
            <div class="i-twemoji-herb text-2xl" />
            <span class="text-center text-sm a-color-text-secondary">有机化肥</span>
            <span class="text-base font-bold a-color-text">{{ formatBucketTime(fertilizerOrganic) }}</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
            <div class="i-twemoji-four-leaf-clover text-2xl" />
            <span class="text-center text-sm a-color-text-secondary">普通收藏</span>
            <span class="text-base font-bold a-color-text">{{ collectionNormal?.count || 0 }}</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 a-bg-fill-tertiary">
            <div class="i-twemoji-gem-stone text-2xl" />
            <span class="text-center text-sm a-color-text-secondary">典藏收藏</span>
            <span class="text-base font-bold a-color-text">{{ collectionRare?.count || 0 }}</span>
          </div>
        </div>
      </a-card>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 flex-col items-stretch gap-3 md:flex-row md:overflow-hidden">
      <!-- Logs -->
      <div class="flex flex-1 flex-col md:w-3/4 md:overflow-hidden">
        <a-card
          variant="borderless"
          class="flex flex-1 flex-col md:overflow-hidden"
          :classes="{ body: '!flex !flex-col !flex-1 !overflow-hidden !p-4' }"
        >
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 text-base font-medium a-color-text">
              <div class="i-twemoji-scroll text-lg" />
              农场日志
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <a-select
                v-model:value="filter.module"
                :options="modules"
                size="small"
                style="width: 7rem"
                @change="onLogFilterChange"
              />
              <a-select
                v-model:value="filter.event"
                :options="events"
                size="small"
                style="width: 7rem"
                @change="onLogFilterChange"
              />
              <a-select
                v-model:value="filter.isWarn"
                :options="logLevels"
                size="small"
                style="width: 7rem"
                @change="onLogFilterChange"
              />
              <a-input
                v-model:value="filter.keyword"
                placeholder="搜索..."
                allow-clear
                size="small"
                style="width: 7rem"
                @press-enter="refresh"
                @change="onLogSearchTrigger"
              />
              <a-button type="primary" size="small" @click="onLogSearchTrigger">
                <template #icon>
                  <SearchOutlined />
                </template>
              </a-button>
            </div>
          </div>

          <div
            ref="logContainer"
            class="max-h-[50vh] min-h-0 flex-1 overflow-y-auto rounded-lg p-3 text-base leading-relaxed font-mono a-bg-fill-tertiary md:max-h-none"
            @scroll="onLogScroll"
          >
            <a-empty v-if="!allLogs.length" description="暂无日志" />
            <div v-for="log in allLogs" :key="log.ts + log.msg" class="mb-1 break-all text-xs">
              <span class="mr-2 select-none a-color-text-tertiary">[{{ formatLogTime(log.time) }}]</span>
              <a-tag
                :color="log.tag === '错误' ? 'red' : log.tag === '警告' ? 'orange' : 'green'"
                size="small"
                class="mr-1"
              >
                {{ log.tag }}
              </a-tag>
              <a-tag v-if="log.meta?.event" color="processing" size="small" class="mr-1">
                {{ getEventLabel(log.meta.event) }}
              </a-tag>
              <span :class="log.tag === '错误' ? 'a-color-error' : 'a-color-text'">{{ log.msg }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <!-- Right Column -->
      <div class="flex flex-col gap-3 md:w-1/4">
        <!-- Next Checks -->
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

        <!-- Operations -->
        <a-card variant="borderless" class="flex-1" :classes="{ body: '!p-4' }">
          <div class="mb-3 flex items-center gap-2 text-base font-medium a-color-text">
            <div class="i-twemoji-bar-chart text-lg" />
            今日统计
          </div>
          <div class="grid grid-cols-2 min-h-20 gap-2">
            <div
              v-for="(val, key) in status?.operations || {}"
              :key="key"
              class="flex items-center justify-between rounded-lg px-2.5 py-2 a-bg-fill-tertiary"
            >
              <div class="flex items-center gap-1.5">
                <div class="text-base" :class="getOpIcon(key)" />
                <span class="text-sm a-color-text-secondary">{{ getOpName(key) }}</span>
              </div>
              <span class="text-base font-bold a-color-text">{{ val }}</span>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>
