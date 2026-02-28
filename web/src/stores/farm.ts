import { defineStore } from 'pinia'
import { ref } from 'vue'
import { farmApi } from '@/api'

export interface Land {
  id: number
  plantName?: string
  phaseName?: string
  seedImage?: string
  status: string
  matureInSec: number
  needWater?: boolean
  needWeed?: boolean
  needBug?: boolean
  [key: string]: any
}

export const useFarmStore = defineStore('farm', () => {
  const lands = ref<Land[]>([])
  const seeds = ref<any[]>([])
  const summary = ref<any>({})
  const loading = ref(false)

  async function fetchLands(accountId: string) {
    if (!accountId)
      return
    loading.value = true
    try {
      const res = await farmApi.fetchLands()
      if (res) {
        lands.value = res.lands || []
        summary.value = res.summary || {}
      }
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSeeds(accountId: string) {
    if (!accountId)
      return
    const res = await farmApi.fetchSeeds()
    seeds.value = Array.isArray(res) ? res : []
  }

  async function operate(accountId: string, opType: string) {
    if (!accountId)
      return
    await farmApi.operate(opType)
    await fetchLands(accountId)
  }

  return { lands, summary, seeds, loading, fetchLands, fetchSeeds, operate }
})
