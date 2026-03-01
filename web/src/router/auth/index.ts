import type { Router } from 'vue-router'
import { createAuthGuard } from './guard'
import { adminToken, clearValidation, ensureTokenValid } from './validate'

export function setupAuthGuard(router: Router): void {
  createAuthGuard(router, {
    ensureTokenValid,
    clearValidation,
    adminToken,
  })
}
