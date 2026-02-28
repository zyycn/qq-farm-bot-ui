import api from '../request'

export function fetchBag() {
  return api.get('/api/bag')
}
