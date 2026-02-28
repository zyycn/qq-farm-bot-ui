<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useBagStore } from '@/stores/bag'
import { useStatusStore } from '@/stores/status'

const accountStore = useAccountStore()
const bagStore = useBagStore()
const statusStore = useStatusStore()
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { items, loading: bagLoading } = storeToRefs(bagStore)
const { status, loading: statusLoading, error: statusError, realtimeConnected } = storeToRefs(statusStore)

const imageErrors = ref<Record<string | number, boolean>>({})

async function loadBag() {
  if (currentAccountId.value) {
    const acc = currentAccount.value
    if (!acc)
      return
    if (!realtimeConnected.value)
      await statusStore.fetchStatus(currentAccountId.value)
    if (acc.running && status.value?.connection?.connected) {
      bagStore.fetchBag(currentAccountId.value)
    }
    imageErrors.value = {}
  }
}

onMounted(() => loadBag())
watch(currentAccountId, () => loadBag())
useIntervalFn(loadBag, 60000)
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-lg font-bold a-color-text">
        <div class="i-carbon-inventory-management a-color-info" />
        背包
      </div>
      <span v-if="items.length" class="text-base a-color-text-tertiary">共 {{ items.length }} 种物品</span>
    </div>

    <a-spin v-if="bagLoading || statusLoading" class="py-12 !block" />

    <a-card v-else-if="!currentAccountId" variant="borderless">
      <a-empty description="请选择账号后查看背包" />
    </a-card>

    <a-alert v-else-if="statusError" type="error" show-icon :message="statusError" class="mb-4" />

    <a-card v-else-if="!status?.connection?.connected" variant="borderless">
      <a-empty description="账号未登录，请先运行账号或检查网络连接" />
    </a-card>

    <a-card v-else-if="items.length === 0" variant="borderless">
      <a-empty description="无可展示物品" />
    </a-card>

    <div v-else class="grid grid-cols-2 gap-3 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xl:grid-cols-6">
      <a-card
        v-for="item in items"
        :key="item.id"
        variant="borderless"
        size="small"
        hoverable
        :classes="{ body: '!p-3 !flex !flex-col !items-center !min-h-[180px]' }"
      >
        <span class="self-start text-xs font-mono a-color-text-tertiary">#{{ item.id }}</span>

        <div class="my-2 h-14 w-14 flex items-center justify-center rounded-full a-bg-fill-tertiary">
          <img
            v-if="item.image && !imageErrors[item.id]"
            :src="item.image"
            :alt="item.name"
            class="max-h-full max-w-full object-contain"
            loading="lazy"
            @error="imageErrors[item.id] = true"
          >
          <span v-else class="text-xl font-bold a-color-text-tertiary">{{ (item.name || '物').slice(0, 1) }}</span>
        </div>

        <div class="mb-1 w-full truncate text-center text-base font-bold a-color-text" :title="item.name">
          {{ item.name || `物品${item.id}` }}
        </div>

        <div class="flex flex-col items-center gap-0.5 text-xs a-color-text-tertiary">
          <span v-if="item.uid">UID: {{ item.uid }}</span>
          <span>
            类型: {{ item.itemType || 0 }}
            <template v-if="item.level > 0"> · Lv{{ item.level }}</template>
            <template v-if="item.price > 0"> · {{ item.price }}金</template>
          </span>
        </div>

        <div class="mt-auto pt-1 text-base font-medium" :class="item.hoursText ? 'a-color-info' : 'a-color-text'">
          {{ item.hoursText || `x${item.count || 0}` }}
        </div>
      </a-card>
    </div>
  </div>
</template>
