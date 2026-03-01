import type { Router } from 'vue-router'
import { ROUTE_NAMES } from '../constants'

export function createAuthGuard(
  router: Router,
  deps: {
    ensureTokenValid: () => Promise<boolean>
    clearValidation: () => void
    adminToken: { value: string }
  },
): void {
  const { ensureTokenValid, clearValidation, adminToken } = deps

  router.beforeEach(async (to) => {
    if (to.name === ROUTE_NAMES.LOGIN) {
      if (!adminToken.value) {
        clearValidation()
        return true
      }
      const valid = await ensureTokenValid()
      if (valid)
        return { name: ROUTE_NAMES.DASHBOARD }
      clearValidation()
      return true
    }

    if (!adminToken.value) {
      clearValidation()
      return { name: ROUTE_NAMES.LOGIN }
    }

    const valid = await ensureTokenValid()
    if (!valid) {
      clearValidation()
      return { name: ROUTE_NAMES.LOGIN }
    }

    return true
  })
}
