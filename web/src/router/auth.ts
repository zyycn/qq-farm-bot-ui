import type { Router } from 'vue-router'
import { useStorage } from '@vueuse/core'
import api from '@/api/request'

const adminToken = useStorage('admin_token', '')
let validatedToken = ''
let validatingPromise: Promise<boolean> | null = null

async function ensureTokenValid() {
  const token = String(adminToken.value || '').trim()
  if (!token)
    return false

  if (validatedToken && validatedToken === token)
    return true

  if (validatingPromise)
    return validatingPromise

  validatingPromise = api.get('/api/auth/validate').then(() => {
    validatedToken = token
    return true
  }).catch(() => false).finally(() => {
    validatingPromise = null
  })

  return validatingPromise
}

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    if (to.name === 'login') {
      if (!adminToken.value) {
        validatedToken = ''
        return true
      }
      const valid = await ensureTokenValid()
      if (valid)
        return { name: 'dashboard' }
      adminToken.value = ''
      validatedToken = ''
      return true
    }

    if (!adminToken.value) {
      validatedToken = ''
      return { name: 'login' }
    }

    const valid = await ensureTokenValid()
    if (!valid) {
      adminToken.value = ''
      validatedToken = ''
      return { name: 'login' }
    }

    return true
  })
}
