import type { Ref } from 'vue'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

/**
 * 基于 matureAt 和 useNow 计算剩余成熟秒数，避免每秒重写 store
 */
export function useLandsWithCountdown(landsRef: Ref<any[]>) {
  const now = useNow({ interval: 1000 })
  return computed(() => {
    const nowSec = Math.floor(now.value.getTime() / 1000)
    return (landsRef.value || []).map((l: any) => ({
      ...l,
      matureInSec:
        l.matureAt != null ? Math.max(0, l.matureAt - nowSec) : (l.matureInSec ?? 0),
    }))
  })
}
