import type { AxiosRequestConfig } from 'axios'
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

api.interceptors.response.use(
  (response) => {
    const body = response.data

    // 统一业务响应结构处理
    if (body && typeof body.ok === 'boolean') {
      if (body.ok)
        return body.data

      return Promise.reject(new Error(body.error || '请求失败'))
    }

    return response
  },

  (error) => {
    const { response, request, message } = error

    // ✅ HTTP 响应错误
    if (response) {
      const { status, statusText, data } = response
      const backendMsg = data?.error || data?.message || ''

      // 401 未授权
      if (status === 401) {
        handleUnauthorized()
        return Promise.reject(error)
      }

      // 服务器错误
      if (status >= 500) {
        if (isIgnorableBackendError(backendMsg)) {
          return Promise.reject(error)
        }

        notify.error(`服务器错误: ${status} ${statusText}`)
        return Promise.reject(error)
      }

      // 其他错误
      notify.error(`请求失败: ${backendMsg || message}`)
      return Promise.reject(error)
    }

    // ✅ 请求发出但无响应
    if (request) {
      notify.error('网络错误，无法连接到服务器')
      return Promise.reject(error)
    }

    // ✅ 其他错误
    notify.error(`错误: ${message}`)
    return Promise.reject(error)
  },
)

function handleUnauthorized() {
  if (window.location.pathname.includes('/login'))
    return

  tokenRef.value = ''
  window.location.href = '/login'
  notify.warning('登录已过期，请重新登录')
}

function isIgnorableBackendError(msg: string) {
  return msg === '账号未运行' || msg === 'API Timeout'
}

interface ApiInstance {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
}

export default api as unknown as ApiInstance
