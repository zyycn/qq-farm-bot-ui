import api from '../request'

export function fetchAccounts() {
  return api.get('/api/accounts')
}

export function saveAccount(payload: any) {
  return api.post('/api/accounts', payload)
}

export function startAccount(id: string) {
  return api.post(`/api/accounts/${id}/start`)
}

export function stopAccount(id: string) {
  return api.post(`/api/accounts/${id}/stop`)
}

export function deleteAccount(id: string) {
  return api.delete(`/api/accounts/${id}`)
}

export function fetchAccountLogs(limit = 100) {
  return api.get(`/api/account-logs?limit=${Math.max(1, Number(limit) || 100)}`)
}

export function createQR() {
  return api.post('/api/qr/create')
}

export function checkQR(code: string) {
  return api.post('/api/qr/check', { code })
}
