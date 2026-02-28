import api from '../request'

export function fetchLands() {
  return api.get('/api/lands')
}

export function fetchSeeds() {
  return api.get('/api/seeds')
}

export function operate(opType: string) {
  return api.post('/api/farm/operate', { opType })
}
