<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { analyticsApi } from '@/api'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const { currentAccountId } = storeToRefs(accountStore)
const hasAccount = computed(() => !!currentAccountId.value)

const tableWrapperRef = ref<HTMLElement | null>(null)
const tableScrollY = ref<number | undefined>(undefined)

useResizeObserver(tableWrapperRef, (entries) => {
  const h = entries[0]?.contentRect.height
  if (h) {
    tableScrollY.value = Math.max(h - 55, 200)
  }
})

const loading = ref(false)
const list = ref<any[]>([])
const sortKey = ref('exp')
const imageErrors = ref<Record<string | number, boolean>>({})
const searchQuery = ref('')

const sortOptions = [
  { value: 'exp', label: '经验/小时' },
  { value: 'fert', label: '普通肥经验/小时' },
  { value: 'profit', label: '利润/小时' },
  { value: 'fert_profit', label: '普通肥利润/小时' },
  { value: 'level', label: '等级' },
]

const sortIcons: Record<string, string> = {
  exp: 'i-twemoji-star',
  fert: 'i-twemoji-test-tube',
  profit: 'i-twemoji-coin',
  fert_profit: 'i-twemoji-money-bag',
  level: 'i-twemoji-trophy',
}

async function loadAnalytics() {
  if (!currentAccountId.value)
    return
  loading.value = true
  try {
    const res = await analyticsApi.fetchAnalytics(sortKey.value)
    const data = Array.isArray(res) ? res : []
    if (data.length > 0) {
      list.value = data
      const metricMap: Record<string, string> = {
        exp: 'expPerHour',
        fert: 'normalFertilizerExpPerHour',
        profit: 'profitPerHour',
        fert_profit: 'normalFertilizerProfitPerHour',
        level: 'level',
      }
      const metric = metricMap[sortKey.value]
      if (metric) {
        list.value.sort((a, b) => {
          const av = Number(a[metric])
          const bv = Number(b[metric])
          if (!Number.isFinite(av) && !Number.isFinite(bv))
            return 0
          if (!Number.isFinite(av))
            return 1
          if (!Number.isFinite(bv))
            return -1
          return bv - av
        })
      }
    }
    else {
      list.value = []
    }
  }
  catch (e) {
    console.error(e)
    list.value = []
  }
  finally {
    loading.value = false
  }
}

const currentPage = ref(1)
const pageSize = ref(50)

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return list.value
  return list.value.filter(
    item =>
      (item.name || '').toLowerCase().includes(q)
      || String(item.seedId || '').includes(q)
      || String(item.level || '').includes(q),
  )
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

watch([searchQuery, sortKey], () => {
  currentPage.value = 1
})

onMounted(() => {
  loadAnalytics()
})

watch([currentAccountId, sortKey], () => {
  loadAnalytics()
})

function formatLv(level: any) {
  if (level === null || level === undefined || level === '' || Number(level) < 0)
    return '未知'
  return String(level)
}

function formatGrowTime(seconds: any) {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0)
    return '0秒'
  if (s < 60)
    return `${s}秒`
  if (s < 3600) {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`
  }
  const hours = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  return mins > 0 ? `${hours}时${mins}分` : `${hours}时`
}

const columns = [
  { title: '#', key: 'rank', width: 50, align: 'center', fixed: 'left' },
  { title: '作物', dataIndex: 'name', key: 'name', fixed: 'left', width: 150 },
  { title: '生长时间', dataIndex: 'growTime', key: 'growTime', width: 110 },
  { title: '经验/时', dataIndex: 'expPerHour', key: 'expPerHour', width: 100 },
  { title: '肥料经验/时', dataIndex: 'normalFertilizerExpPerHour', key: 'normalFertilizerExpPerHour', width: 120 },
  { title: '净利润/时', dataIndex: 'profitPerHour', key: 'profitPerHour', width: 110 },
  { title: '肥料利润/时', dataIndex: 'normalFertilizerProfitPerHour', key: 'normalFertilizerProfitPerHour', width: 150 },
]

function getHighlightColor(key: string): string {
  const map: Record<string, string> = {
    exp: 'var(--ant-color-info)',
    fert: 'var(--ant-color-info)',
    profit: 'var(--ant-color-warning)',
    fert_profit: 'var(--ant-color-success)',
  }
  return map[key] || 'var(--ant-color-text)'
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <div class="flex items-center gap-2 text-base font-bold a-color-text">
      <div class="i-twemoji-bar-chart text-lg" />
      数据分析
    </div>

    <div v-if="!hasAccount" class="flex flex-1 flex-col items-center justify-center gap-3">
      <div class="i-twemoji-bar-chart text-5xl opacity-30" />
      <div class="text-base a-color-text-tertiary">
        请先在侧边栏选择账号
      </div>
    </div>

    <a-card
      v-else
      variant="borderless"
      class="analytics-card flex-1 overflow-hidden"
      :classes="{ body: '!p-0 !h-full !flex !flex-col' }"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b border-b-solid px-4 py-2.5 a-border-b-border-sec"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 rounded-lg p-0.5 a-bg-fill-tertiary">
            <a-button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="text"
              class="rounded-md px-2.5 py-1 text-sm transition-all"
              :class="
                sortKey === opt.value
                  ? 'a-bg-container a-color-primary-text font-semibold shadow-sm a-bg-primary-bg hover:!a-bg-primary-bg hover:!a-color-primary-text'
                  : 'a-color-text-secondary'
              "
              @click="sortKey = opt.value"
            >
              <div class="text-base" :class="sortIcons[opt.value]" />
              <span class="hidden sm:inline">{{ opt.label }}</span>
            </a-button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span v-if="filteredList.length" class="text-sm a-color-text-tertiary">{{ filteredList.length }} 种作物</span>
          <a-input v-model:value="searchQuery" placeholder="搜索作物..." allow-clear class="!w-48">
            <template #prefix>
              <div class="i-twemoji-magnifying-glass-tilted-left text-sm" />
            </template>
          </a-input>
        </div>
      </div>

      <!-- Table -->
      <div ref="tableWrapperRef" class="min-h-0 flex-1">
        <a-table
          :columns="columns"
          :data-source="pagedList"
          :loading="loading"
          :pagination="false"
          :row-key="(record: any) => record.seedId"
          :scroll="{ x: 800, y: tableScrollY }"
          size="middle"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'rank'">
              <div v-if="(currentPage - 1) * pageSize + index < 3" class="flex items-center justify-center">
                <div
                  class="text-2xl"
                  :class="[
                    (currentPage - 1) * pageSize + index === 0 ? 'i-twemoji-1st-place-medal' : '',
                    (currentPage - 1) * pageSize + index === 1 ? 'i-twemoji-2nd-place-medal' : '',
                    (currentPage - 1) * pageSize + index === 2 ? 'i-twemoji-3rd-place-medal' : '',
                  ]"
                />
              </div>
              <span v-else class="text-base a-color-text-tertiary">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            </template>

            <template v-else-if="column.key === 'name'">
              <div class="flex items-center gap-2.5">
                <div
                  class="h-9 w-9 flex shrink-0 items-center justify-center overflow-hidden rounded-lg a-bg-fill-tertiary"
                >
                  <img
                    v-if="record.image && !imageErrors[record.seedId]"
                    :src="record.image"
                    class="h-7 w-7 object-contain"
                    loading="lazy"
                    @error="imageErrors[record.seedId] = true"
                  >
                  <div v-else class="i-twemoji-seedling text-lg" />
                </div>
                <div class="min-w-0 flex flex-col gap-1.5">
                  <div class="text-base font-semibold a-color-text">
                    {{ record.name }}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="rounded px-1.5 py-px text-xs font-medium a-color-primary-text a-bg-primary-bg">Lv{{ formatLv(record.level) }}</span>
                    <span class="text-xs a-color-text-tertiary">{{ record.seasons }}季</span>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="column.key === 'growTime'">
              <span class="text-base a-color-text">{{ formatGrowTime(record.growTime) }}</span>
            </template>

            <template v-else-if="column.key === 'expPerHour'">
              <span
                class="text-base font-bold"
                :style="{ color: sortKey === 'exp' ? getHighlightColor('exp') : 'var(--ant-color-text)' }"
              >{{ record.expPerHour }}</span>
            </template>

            <template v-else-if="column.key === 'normalFertilizerExpPerHour'">
              <span
                class="text-base font-bold"
                :style="{ color: sortKey === 'fert' ? getHighlightColor('fert') : 'var(--ant-color-text)' }"
              >{{ record.normalFertilizerExpPerHour ?? '-' }}</span>
            </template>

            <template v-else-if="column.key === 'profitPerHour'">
              <span
                class="text-base font-bold"
                :style="{ color: sortKey === 'profit' ? getHighlightColor('profit') : 'var(--ant-color-text)' }"
              >{{ record.profitPerHour ?? '-' }}</span>
            </template>

            <template v-else-if="column.key === 'normalFertilizerProfitPerHour'">
              <span
                class="text-base font-bold"
                :style="{
                  color: sortKey === 'fert_profit' ? getHighlightColor('fert_profit') : 'var(--ant-color-text)',
                }"
              >{{ record.normalFertilizerProfitPerHour ?? '-' }}</span>
            </template>
          </template>

          <template #emptyText>
            <div class="flex flex-col items-center gap-2 py-8">
              <div class="i-twemoji-bar-chart text-3xl opacity-30" />
              <span class="text-base a-color-text-tertiary">{{ searchQuery ? '未找到匹配的作物' : '暂无数据' }}</span>
            </div>
          </template>
        </a-table>
      </div>

      <!-- Pagination -->
      <div
        v-if="filteredList.length"
        class="flex items-center justify-between border-t border-t-solid px-4 py-3 a-border-t-border-sec"
      >
        <span class="text-base a-color-text-tertiary">共 {{ filteredList.length }} 种作物</span>
        <a-pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="filteredList.length"
          show-size-changer
          :page-size-options="['20', '50', '100']"
          show-quick-jumper
        />
      </div>
    </a-card>
  </div>
</template>
