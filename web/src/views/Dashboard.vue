<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useAccountStore } from '@/stores/account'
import { useBagStore } from '@/stores/bag'
import { useStatusStore } from '@/stores/status'

const statusStore = useStatusStore()
const accountStore = useAccountStore()
const bagStore = useBagStore()
const { status, logs: statusLogs } = storeToRefs(statusStore)
const { currentAccountId, logs: accountLogs } = storeToRefs(accountStore)
const { dashboardItems } = storeToRefs(bagStore)
const logContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const allLogs = computed(() => {
  const sLogs = statusLogs.value || []
  const aLogs = (accountLogs.value || []).map((l: any) => ({
    ts: new Date(l.time).getTime(),
    time: l.time,
    tag: l.action === 'Error' ? '错误' : '系统',
    msg: l.reason ? `${l.msg} (${l.reason})` : l.msg,
    isAccountLog: true,
  }))

  return [...sLogs, ...aLogs].sort((a, b) => a.ts - b.ts)
})

const filter = reactive({
  module: '',
  event: '',
  keyword: '',
  isWarn: false,
})

const modules = [
  { label: '所有模块', value: '' },
  { label: '农场', value: 'farm' },
  { label: '好友', value: 'friend' },
  { label: '仓库', value: 'warehouse' },
  { label: '任务', value: 'task' },
  { label: '系统', value: 'sys' },
]

const events = [
  { label: '所有事件', value: '' },
  { label: '收获', value: 'harvest' },
  { label: '偷菜', value: 'steal' },
  { label: '浇水', value: 'water' },
  { label: '除草', value: 'weed' },
  { label: '除虫', value: 'bug' },
  { label: '施肥', value: 'fertilize' },
  { label: '种植', value: 'plant' },
  { label: '帮浇', value: 'helpWater' },
  { label: '帮草', value: 'helpWeed' },
  { label: '帮虫', value: 'helpBug' },
  { label: '任务', value: 'taskClaim' },
  { label: '出售', value: 'sell' },
  { label: '升级', value: 'upgrade' },
]

const displayName = computed(() => {
  // Try to use nickname from status (game server)
  const gameName = status.value?.status?.name
  if (gameName)
    return gameName

  // Check login status
  if (!status.value?.connection?.connected) {
    const account = accountStore.currentAccount
    return account?.name || account?.nick || '未登录'
  }

  // Fallback to account name (usually ID) or '未命名'
  const account = accountStore.currentAccount
  return account?.name || account?.nick || '未命名'
})

// Exp Rate & Time to Level
const expRate = computed(() => {
  const gain = status.value?.sessionExpGained || 0
  const uptime = status.value?.uptime || 0
  if (!uptime)
    return '0/时'
  const hours = uptime / 3600
  const rate = hours > 0 ? (gain / hours) : 0
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
  const ratePerHour = hours > 0 ? (gain / hours) : 0
  if (ratePerHour <= 0)
    return ''

  const expNeeded = needed - current
  const minsToLevel = expNeeded / (ratePerHour / 60)

  if (minsToLevel < 60)
    return `约 ${Math.ceil(minsToLevel)} 分钟后升级`
  return `约 ${(minsToLevel / 60).toFixed(1)} 小时后升级`
})

// Fertilizer & Collection
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

// Next Check Countdown
const nextFarmCheck = ref('--')
const nextFriendCheck = ref('--')
const localUptime = ref(0)
let localNextFarmRemainSec = 0
let localNextFriendRemainSec = 0

function updateCountdowns() {
  // Update uptime
  if (status.value?.connection?.connected) {
    localUptime.value++
  }

  if (localNextFarmRemainSec > 0) {
    localNextFarmRemainSec--
    nextFarmCheck.value = formatDuration(localNextFarmRemainSec)
  }
  else {
    nextFarmCheck.value = '--'
  }

  if (localNextFriendRemainSec > 0) {
    localNextFriendRemainSec--
    nextFriendCheck.value = formatDuration(localNextFriendRemainSec)
  }
  else {
    nextFriendCheck.value = '--'
  }
}

watch(status, (newVal) => {
  if (newVal?.nextChecks) {
    // Only update local counters if they are significantly different or 0
    // Actually, we should sync from server periodically.
    // Here we just take server value when it comes.
    localNextFarmRemainSec = newVal.nextChecks.farmRemainSec || 0
    localNextFriendRemainSec = newVal.nextChecks.friendRemainSec || 0
    updateCountdowns() // Update immediately
  }
  if (newVal?.uptime !== undefined) {
    localUptime.value = newVal.uptime
  }
}, { deep: true })

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

function getLogTagClass(tag: string) {
  if (tag === '错误')
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (tag === '系统')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (tag === '警告')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
}

function getLogMsgClass(tag: string) {
  if (tag === '错误')
    return 'text-red-600 dark:text-red-400'
  return 'text-gray-700 dark:text-gray-300'
}

function formatLogTime(timeStr: string) {
  // 2024/5/20 12:34:56 -> 12:34:56
  if (!timeStr)
    return ''
  const parts = timeStr.split(' ')
  return parts.length > 1 ? parts[1] : timeStr
}

function getOpName(key: string | number) {
  const map: Record<string, string> = {
    harvest: '收获',
    water: '浇水',
    weed: '除草',
    bug: '除虫',
    fertilize: '施肥',
    plant: '种植',
    steal: '偷菜',
    helpWater: '帮浇',
    helpWeed: '帮草',
    helpBug: '帮虫',
    taskClaim: '任务',
    sell: '出售',
    upgrade: '升级',
  }
  return map[String(key)] || String(key)
}

function getExpPercent(p: any) {
  if (!p || !p.needed)
    return 0
  return Math.min(100, Math.max(0, (p.current / p.needed) * 100))
}

function refresh() {
  if (currentAccountId.value) {
    statusStore.fetchStatus(currentAccountId.value)
    statusStore.fetchLogs(currentAccountId.value, {
      module: filter.module || undefined,
      event: filter.event || undefined,
      keyword: filter.keyword || undefined,
      isWarn: filter.isWarn ? 'true' : undefined,
    })
    accountStore.fetchLogs()
    bagStore.fetchBag(currentAccountId.value)
  }
}

watch(currentAccountId, () => {
  refresh()
})

function onLogScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el)
    return
  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  autoScroll.value = isNearBottom
}

// Auto scroll logs
watch(allLogs, () => {
  nextTick(() => {
    if (logContainer.value && autoScroll.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}, { deep: true })

onMounted(() => {
  refresh()
})

// Auto refresh every 5s
useIntervalFn(refresh, 5000)
// Countdown timer (every 1s)
useIntervalFn(updateCountdowns, 1000)
</script>

<template>
  <div class="pt-6 space-y-6">
    <!-- Status Cards -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
      <!-- Account & Exp -->
      <div class="flex flex-col rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="mb-2 flex items-start justify-between">
          <div class="flex items-center gap-1.5 text-sm text-gray-500">
            <div class="i-fas-user-circle" />
            账号
          </div>
          <div class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Lv.{{ status?.status?.level || 0 }}
          </div>
        </div>
        <div class="mb-1 truncate text-xl font-bold" :title="displayName">
          {{ displayName }}
        </div>

        <!-- Level Progress -->
        <div class="mt-auto">
          <div class="mb-1 flex justify-between text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <div class="i-fas-bolt text-blue-400" />
              <span>EXP</span>
            </div>
            <span>{{ status?.levelProgress?.current || 0 }} / {{ status?.levelProgress?.needed || '?' }}</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              class="h-full rounded-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${getExpPercent(status?.levelProgress)}%` }"
            />
          </div>
          <div class="mt-2 flex justify-between text-xs text-gray-400">
            <span>效率: {{ expRate }}</span>
            <span>{{ timeToLevel }}</span>
          </div>
        </div>
      </div>

      <!-- Assets & Status -->
      <div class="flex flex-col justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="flex justify-between">
          <div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500">
              <div class="i-fas-coins text-yellow-500" />
              金币
            </div>
            <div class="text-2xl text-yellow-600 font-bold dark:text-yellow-500">
              {{ status?.status?.gold || 0 }}
            </div>
            <div v-if="status?.sessionGoldGained > 0" class="text-[10px] text-green-500">
              +{{ status?.sessionGoldGained }}
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center justify-end gap-1.5 text-xs text-gray-500">
              <div class="i-fas-ticket-alt text-emerald-400" />
              点券
            </div>
            <div class="text-2xl text-emerald-500 font-bold dark:text-emerald-400">
              {{ status?.status?.coupon || 0 }}
            </div>
            <div v-if="status?.sessionCouponGained > 0" class="text-[10px] text-green-500">
              +{{ status?.sessionCouponGained }}
            </div>
          </div>
        </div>
        <div class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full" :class="status?.connection?.connected ? 'bg-green-500' : 'bg-red-500'" />
              <span class="text-xs font-bold">{{ status?.connection?.connected ? '在线' : '离线' }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <div class="i-fas-clock text-purple-400" />
              {{ formatDuration(localUptime) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Items (Fertilizer & Collection) -->
      <div class="flex flex-col justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="mb-2 flex items-center gap-1.5 text-sm text-gray-500">
          <div class="i-fas-flask text-emerald-400" />
          化肥容器
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <div class="i-fas-flask text-emerald-400" />
              普通
            </div>
            <div class="font-bold">
              {{ formatBucketTime(fertilizerNormal) }}
            </div>
          </div>
          <div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <div class="i-fas-vial text-emerald-400" />
              有机
            </div>
            <div class="font-bold">
              {{ formatBucketTime(fertilizerOrganic) }}
            </div>
          </div>
        </div>
        <div class="my-2 border-t border-gray-100 dark:border-gray-700" />
        <div class="mb-1 flex items-center gap-1.5 text-sm text-gray-500">
          <div class="i-fas-star text-emerald-400" />
          收藏点
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <div class="i-fas-bookmark text-emerald-400" />
              普通
            </div>
            <div class="font-bold">
              {{ collectionNormal?.count || 0 }}
            </div>
          </div>
          <div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <div class="i-fas-gem text-emerald-400" />
              典藏
            </div>
            <div class="font-bold">
              {{ collectionRare?.count || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Flex -->
    <div class="flex flex-col items-stretch gap-6 lg:flex-row">
      <!-- Logs (Left Column) -->
      <div class="flex flex-col gap-6 lg:w-3/4">
        <!-- Logs -->
        <div class="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="flex items-center gap-2 text-lg font-medium">
              <div class="i-carbon-document" />
              <span>运行日志</span>
            </h3>

            <div class="flex flex-wrap items-center gap-2 text-sm">
              <BaseSelect
                v-model="filter.module"
                :options="modules"
                class="w-32"
                @change="refresh"
              />

              <BaseSelect
                v-model="filter.event"
                :options="events"
                class="w-32"
                @change="refresh"
              />

              <BaseInput
                v-model="filter.keyword"
                placeholder="关键词..."
                class="w-32"
                clearable
                @keyup.enter="refresh"
                @clear="refresh"
              />

              <BaseCheckbox
                v-model="filter.isWarn"
                label="只看异常"
                @change="refresh"
              />

              <BaseButton
                variant="primary"
                size="sm"
                @click="refresh"
              >
                <div class="i-carbon-search" />
              </BaseButton>
            </div>
          </div>

          <div ref="logContainer" class="h-[500px] overflow-y-auto rounded bg-gray-50 p-4 text-sm leading-relaxed font-mono dark:bg-gray-900" @scroll="onLogScroll">
            <div v-if="!allLogs.length" class="py-8 text-center text-gray-400">
              暂无日志
            </div>
            <div v-for="log in allLogs" :key="log.ts + log.msg" class="mb-1 break-all">
              <span class="mr-2 select-none text-gray-400">[{{ formatLogTime(log.time) }}]</span>
              <span class="mr-2 rounded px-1.5 py-0.5 text-xs font-bold" :class="getLogTagClass(log.tag)">{{ log.tag }}</span>
              <span :class="getLogMsgClass(log.tag)">{{ log.msg }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column Stack -->
      <div class="flex flex-col gap-6 lg:w-1/4">
        <!-- Next Checks -->
        <div class="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-medium">
            <div class="i-carbon-hourglass" />
            <span>下次巡查倒计时</span>
          </h3>
          <div class="flex flex-col justify-center gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div class="i-carbon-sprout text-lg text-green-500" />
                <span>农场</span>
              </div>
              <div class="text-lg font-bold font-mono">
                {{ nextFarmCheck }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div class="i-carbon-collaborate text-lg text-blue-500" />
                <span>好友</span>
              </div>
              <div class="text-lg font-bold font-mono">
                {{ nextFriendCheck }}
              </div>
            </div>
          </div>
        </div>

        <!-- Operations Grid -->
        <div class="flex-1 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="mb-3 flex items-center gap-2 text-lg font-medium">
            <div class="i-carbon-chart-column" />
            <span>今日统计</span>
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(val, key) in (status?.operations || {})" :key="key" class="rounded bg-gray-50 p-2 text-center dark:bg-gray-700/30">
              <div class="mb-1 text-[10px] text-gray-500">
                {{ getOpName(key) }}
              </div>
              <div class="text-sm font-bold">
                {{ val }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
