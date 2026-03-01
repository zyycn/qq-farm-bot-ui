import { useStorage } from '@vueuse/core'
import api from '@/api/request'

export const adminToken = useStorage('admin_token', '')
let validatedToken = ''
let validatingPromise: Promise<boolean> | null = null

export async function ensureTokenValid(): Promise<boolean> {
  const token = String(adminToken.value || '').trim()
  if (!token)
    return false

  if (validatedToken && validatedToken === token)
    return true

  if (validatingPromise)
    return validatingPromise

  validatingPromise = api.get('/api/auth/validate')
    .then(() => {
      validatedToken = token
      return true
    })
    .catch(() => false)
    .finally(() => {
      validatingPromise = null
    })

  return validatingPromise
}

export function clearValidation(): void {
  validatedToken = ''
  adminToken.value = ''
}
