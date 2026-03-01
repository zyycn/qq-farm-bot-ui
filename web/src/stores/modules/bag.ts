import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bagApi } from '@/api'
import { BAG_DASHBOARD_ITEM_IDS, BAG_ERROR_COOLDOWN_MS, BAG_HIDDEN_ITEM_IDS } from '../constants'

export const useBagStore = defineStore('bag', () => {
  const allItems = ref<any[]>([])
  const loading = ref(false)
  const lastErrorAt = ref(0)

  const items = computed(() => {
    return allItems.value.filter((it: any) => !BAG_HIDDEN_ITEM_IDS.has(Number(it.id || 0)))
  })

  const dashboardItems = computed(() => {
    return allItems.value.filter((it: any) => BAG_DASHBOARD_ITEM_IDS.has(Number(it.id || 0)))
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
