import api from '../request'

export function fetchStatus() {
  return api.get('/api/status')
}

export function fetchLogs(accountId?: string, params?: Record<string, any>) {
  const requestParams: Record<string, any> = { limit: 100, ...params }
  if (!accountId || accountId === 'all') {
    requestParams.accountId = 'all'
  }
  return api.get('/api/logs', { params: requestParams })
}

export function fetchDailyGifts() {
  return api.get('/api/daily-gifts')
}

export function fetchAccountLogs(limit = 100) {
  return api.get(`/api/account-logs?limit=${Math.max(1, Number(limit) || 100)}`)
}
