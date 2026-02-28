import api from '../request'

export function fetchAnalytics(sort?: string) {
  return api.get('/api/analytics', sort ? { params: { sort } } : undefined)
}
