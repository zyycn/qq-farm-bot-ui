import api from '../request'

export function fetchSettings() {
  return api.get('/api/settings')
}

export function saveSettings(payload: any) {
  const settingsPayload = {
    plantingStrategy: payload.plantingStrategy,
    preferredSeedId: payload.preferredSeedId,
    intervals: payload.intervals,
    friendQuietHours: payload.friendQuietHours,
  }
  return api.post('/api/settings/save', settingsPayload)
}

export function saveAutomation(automation: any) {
  return api.post('/api/automation', automation)
}

export function saveTheme(theme: 'light' | 'dark') {
  return api.post('/api/settings/theme', { theme })
}

export function saveOfflineReminder(config: any) {
  return api.post('/api/settings/offline-reminder', config)
}

export function changePassword(oldPassword: string, newPassword: string) {
  return api.post('/api/admin/change-password', { oldPassword, newPassword })
}
