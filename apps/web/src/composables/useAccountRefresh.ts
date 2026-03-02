import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useAccountStore } from '@/stores'

/**
 * 统一处理 onMounted + watch(currentAccountId) 的页面数据刷新模式
 */
export function useAccountRefresh(fn: () => void | Promise<void>): void {
  const accountStore = useAccountStore()
  const { currentAccountId } = storeToRefs(accountStore)

  onMounted(fn)
  watch(currentAccountId, fn)
}
