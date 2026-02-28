import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bagApi } from '@/api'

const BAG_ERROR_COOLDOWN_MS = 15_000

export const useBagStore = defineStore('bag', () => {
  const allItems = ref<any[]>([])
  const loading = ref(false)
  const lastErrorAt = ref(0)

  const items = computed(() => {
    // Filter out hidden items (e.g. coins, coupons, exp which are shown in dashboard)
    const hiddenIds = new Set([1, 1001, 1002, 1101, 1011, 1012, 3001, 3002])
    return allItems.value.filter((it: any) => !hiddenIds.has(Number(it.id || 0)))
  })

  const dashboardItems = computed(() => {
    const targetIds = new Set([1011, 1012, 3001, 3002])
    return allItems.value.filter((it: any) => targetIds.has(Number(it.id || 0)))
  })

  async function fetchBag(accountId: string) {
    if (!accountId)
      return
    if (Date.now() - lastErrorAt.value < BAG_ERROR_COOLDOWN_MS)
      return
    loading.value = true
    try {
      const res = await bagApi.fetchBag()
      if (res) {
        allItems.value = Array.isArray(res.items) ? res.items : []
      }
    }
    catch (e) {
      lastErrorAt.value = Date.now()
      console.error('获取背包失败:', e)
    }
    finally {
      loading.value = false
    }
  }

  return { items, allItems, dashboardItems, loading, fetchBag }
})
