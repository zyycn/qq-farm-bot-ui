import api from '../request'

export function login(password: string) {
  return api.post('/api/login', { password })
}

export function ping() {
  return api.get('/api/ping')
}
