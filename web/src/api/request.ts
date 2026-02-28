import { useStorage } from '@vueuse/core'
import axios from 'axios'
import notify from '@/utils/notify'

const tokenRef = useStorage('admin_token', '')
const accountIdRef = useStorage('current_account_id', '')

const api = axios.create({
  baseURL: '/',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = tokenRef.value
  if (token) {
    config.headers['x-admin-token'] = token
  }
  const accountId = accountIdRef.value
  if (accountId) {
    config.headers['x-account-id'] = accountId
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response) {
    if (error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        tokenRef.value = ''
        window.location.href = '/login'
        notify.warning('登录已过期，请重新登录')
      }
    }
    else if (error.response.status >= 500) {
      const backendError = String(error.response.data?.error || error.response.data?.message || '')
      if (backendError === '账号未运行' || backendError === 'API Timeout') {
        return Promise.reject(error)
      }
      notify.error(`服务器错误: ${error.response.status} ${error.response.statusText}`)
    }
    else {
      const msg = error.response.data?.message || error.message
      notify.error(`请求失败: ${msg}`)
    }
  }
  else if (error.request) {
    notify.error('网络错误，无法连接到服务器')
  }
  else {
    notify.error(`错误: ${error.message}`)
  }

  return Promise.reject(error)
})

export default api
