import { notification } from 'antdv-next'

const recentKeys = new Set<string>()

function show(type: 'success' | 'error' | 'warning' | 'info', description: string, duration?: number) {
  const dedup = `${type}:${description}`
  if (recentKeys.has(dedup))
    return
  recentKeys.add(dedup)
  setTimeout(() => recentKeys.delete(dedup), 2000)

  const titleMap = { success: '成功', error: '错误', warning: '警告', info: '提示' }
  notification[type]({ title: titleMap[type], description, duration })
}

const notify = {
  success: (msg: string, duration = 3) => show('success', msg, duration),
  error: (msg: string, duration = 5) => show('error', msg, duration),
  warning: (msg: string, duration = 4) => show('warning', msg, duration),
  info: (msg: string, duration = 3) => show('info', msg, duration),
}

export default notify
