import type { AxiosRequestConfig } from 'axios'
import { useStorage } from '@vueuse/core'
import axios from 'axios'
import notify from '@/utils/notify'

const tokenRef = useStorage('admin_token', '')
const accountIdRef = useStorage('current_account_id', '')

const IGNORABLE_ERRORS = ['账号未运行', 'API Timeout'] as const

interface NestResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const api = axios.create({
  baseURL: '/',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  if (tokenRef.value)
    config.headers.Authorization = `Bearer ${tokenRef.value}`
  if (accountIdRef.value)
    config.headers['x-account-id'] = accountIdRef.value
  return config
}, error => Promise.reject(error))

function unwrapResponse(response: any) {
  const body = response.data as NestResponse | undefined
  const isNest = body && typeof body.code === 'number'
  if (!isNest)
    return response
  if (body.code >= 200 && body.code < 300)
    return body.data as any
  return Promise.reject(new Error(body.message || '请求失败'))
}

function pickErrorNotify(error: any): string | null {
  const { response, request, message } = error
  if (!response)
    return request ? '网络错误，无法连接到服务器' : `错误: ${message}`
  if (response.status === 401)
    return null
  const msg = response.data?.message || response.data?.error || message
  if (response.status >= 500 && IGNORABLE_ERRORS.includes(msg))
    return null
  return response.status >= 500
    ? `服务器错误: ${response.status} ${response.statusText}`
    : `请求失败: ${msg}`
}

api.interceptors.response.use(
  unwrapResponse,
  (error) => {
    const backendMsg = error.response?.data?.message || error.response?.data?.error
    if (backendMsg)
      error.message = backendMsg
    const msg = pickErrorNotify(error)
    error.response?.status === 401 ? handleUnauthorized() : msg && notify.error(msg)
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

interface ApiInstance {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
}

export default api as unknown as ApiInstance
