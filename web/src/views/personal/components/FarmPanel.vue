<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import LandCard from '@/components/LandCard.vue'

import { useAccountStore } from '@/stores/account'
import { useFarmStore } from '@/stores/farm'
import { useStatusStore } from '@/stores/status'

const farmStore = useFarmStore()
const accountStore = useAccountStore()
const statusStore = useStatusStore()
const { lands, summary, loading } = storeToRefs(farmStore)
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { status, loading: statusLoading, realtimeConnected } = storeToRefs(statusStore)

const operating = ref(false)
const confirmVisible = ref(false)
const confirmConfig = ref({ title: '', message: '', opType: '' })

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
  const confirmMap: Record<string, string> = {
    harvest: '确定要收获所有成熟作物吗？',
    clear: '确定要一键除草/除虫吗？',
    plant: '确定要一键种植吗？(根据策略配置)',
    upgrade: '确定要升级所有可升级的土地吗？(消耗金币)',
    all: '确定要一键全收吗？(包含收获、除草、种植等)',
  }
  confirmConfig.value = {
    title: '确认操作',
    message: confirmMap[opType] || '确定执行此操作吗？',
    opType,
  }
  confirmVisible.value = true
}

const operations = [
  { type: 'harvest', label: '收获', icon: 'i-carbon-wheat', color: 'blue' as const },
  { type: 'clear', label: '除草/虫', icon: 'i-carbon-clean', color: 'cyan' as const },
  { type: 'plant', label: '种植', icon: 'i-carbon-sprout', color: 'green' as const },
  { type: 'upgrade', label: '升级土地', icon: 'i-carbon-upgrade', color: 'purple' as const },
  { type: 'all', label: '一键全收', icon: 'i-carbon-flash', color: 'orange' as const },
]

async function refresh() {
  if (currentAccountId.value) {
    const acc = currentAccount.value
    if (!acc)
      return
    if (!realtimeConnected.value)
      await statusStore.fetchStatus(currentAccountId.value)
    if (acc.running && status.value?.connection?.connected)
      farmStore.fetchLands(currentAccountId.value)
  }
}

watch(currentAccountId, () => refresh())

const { pause, resume } = useIntervalFn(() => {
  if (lands.value) {
    lands.value = lands.value.map((l: any) => (l.matureInSec > 0 ? { ...l, matureInSec: l.matureInSec - 1 } : l))
  }
}, 1000)

const { pause: pauseRefresh, resume: resumeRefresh } = useIntervalFn(refresh, 60000)

onMounted(() => {
  refresh()
  resume()
  resumeRefresh()
})

onUnmounted(() => {
  pause()
  pauseRefresh()
})
</script>

<template>
  <div class="space-y-4">
    <a-card variant="borderless" :classes="{ body: '!p-0' }">
      <div class="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
        <div class="flex items-center gap-2 text-base font-bold a-color-text">
          <div class="i-carbon-grid text-lg a-color-info" />
          土地详情
        </div>
        <a-space wrap>
          <a-button
            v-for="op in operations"
            :key="op.type"
            size="small"
            :color="op.color"
            variant="solid"
            :disabled="operating"
            @click="handleOperate(op.type)"
          >
            <template #icon>
              <div :class="op.icon" />
            </template>
            {{ op.label }}
          </a-button>
        </a-space>
      </div>

      <div class="border-t border-t-solid px-4 py-2.5 a-border-t-border-sec">
        <a-space wrap>
          <a-tag color="orange">
            <div class="i-carbon-clean mr-1 inline-block align-middle" />
            可收: {{ summary?.harvestable || 0 }}
          </a-tag>
          <a-tag color="green">
            <div class="i-carbon-sprout mr-1 inline-block align-middle" />
            生长: {{ summary?.growing || 0 }}
          </a-tag>
          <a-tag>
            <div class="i-carbon-checkbox mr-1 inline-block align-middle" />
            空闲: {{ summary?.empty || 0 }}
          </a-tag>
          <a-tag color="red">
            <div class="i-carbon-warning mr-1 inline-block align-middle" />
            枯萎: {{ summary?.dead || 0 }}
          </a-tag>
        </a-space>
      </div>

      <div class="p-4">
        <a-spin v-if="loading || statusLoading" class="py-12 !block" />
        <a-empty v-else-if="!status?.connection?.connected" description="账号未登录，请先运行账号或检查网络连接" />
        <a-empty v-else-if="!lands || lands.length === 0" description="暂无土地数据" />
        <div v-else class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3">
          <LandCard v-for="land in lands" :key="land.id" :land="land" />
        </div>
      </div>
    </a-card>

    <ConfirmModal
      :show="confirmVisible"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      @confirm="executeOperate"
      @cancel="confirmVisible = false"
    />
  </div>
</template>
