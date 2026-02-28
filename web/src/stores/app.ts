import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { settingsApi } from '@/api'

const THEME_KEY = 'ui_theme'

export interface ThemeTokens {
  colorPrimary: string
  colorPrimaryBg: string
  colorPrimaryBgHover: string
  colorPrimaryText: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  colorInfo: string
  colorLink: string
  borderRadius: number
  colorBgContainer: string
  colorBgLayout: string
  colorBgElevated: string
  colorBgSpotlight: string
  colorText: string
  colorTextSecondary: string
  colorTextTertiary: string
  colorTextQuaternary: string
  colorBorder: string
  colorBorderSecondary: string
  colorFill: string
  colorFillSecondary: string
  colorFillTertiary: string
  colorFillQuaternary: string
}

const lightTokens: ThemeTokens = {
  colorPrimary: '#22c55e',
  colorPrimaryBg: 'rgba(34, 197, 94, 0.08)',
  colorPrimaryBgHover: 'rgba(34, 197, 94, 0.15)',
  colorPrimaryText: '#15803d',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorInfo: '#3b82f6',
  colorLink: '#22c55e',
  borderRadius: 8,
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorBgElevated: '#ffffff',
  colorBgSpotlight: '#f9fafb',
  colorText: 'rgba(0, 0, 0, 0.88)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
  colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
  colorBorder: '#d9d9d9',
  colorBorderSecondary: '#f0f0f0',
  colorFill: 'rgba(0, 0, 0, 0.06)',
  colorFillSecondary: 'rgba(0, 0, 0, 0.04)',
  colorFillTertiary: 'rgba(0, 0, 0, 0.02)',
  colorFillQuaternary: 'rgba(0, 0, 0, 0.01)',
}

const darkTokens: ThemeTokens = {
  colorPrimary: '#4ade80',
  colorPrimaryBg: 'rgba(74, 222, 128, 0.1)',
  colorPrimaryBgHover: 'rgba(74, 222, 128, 0.18)',
  colorPrimaryText: '#4ade80',
  colorSuccess: '#4ade80',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  colorInfo: '#60a5fa',
  colorLink: '#4ade80',
  borderRadius: 8,
  colorBgContainer: '#1f2937',
  colorBgLayout: '#111827',
  colorBgElevated: '#374151',
  colorBgSpotlight: 'rgba(255, 255, 255, 0.04)',
  colorText: 'rgba(255, 255, 255, 0.88)',
  colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
  colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
  colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
  colorBorder: '#374151',
  colorBorderSecondary: '#1f2937',
  colorFill: 'rgba(255, 255, 255, 0.08)',
  colorFillSecondary: 'rgba(255, 255, 255, 0.06)',
  colorFillTertiary: 'rgba(255, 255, 255, 0.04)',
  colorFillQuaternary: 'rgba(255, 255, 255, 0.02)',
}

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(false)
  const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === '1')
  const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark')

  const themeTokens = computed<ThemeTokens>(() => isDark.value ? darkTokens : lightTokens)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
    localStorage.setItem('sidebar_collapsed', val ? '1' : '0')
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed(!sidebarCollapsed.value)
  }

  async function fetchTheme() {
    try {
      const res = await settingsApi.fetchSettings()
      if (res.data.ok && res.data.data.ui) {
        const t = res.data.data.ui.theme
        isDark.value = t === 'dark'
        localStorage.setItem(THEME_KEY, t)
      }
    }
    catch {
      // 未登录时静默失败，使用本地缓存值
    }
  }

  async function setTheme(t: 'light' | 'dark') {
    try {
      await settingsApi.saveTheme(t)
      isDark.value = t === 'dark'
      localStorage.setItem(THEME_KEY, t)
    }
    catch (e) {
      console.error('Failed to set theme:', e)
    }
  }

  function toggleDark() {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  watch(isDark, (val) => {
    if (val)
      document.documentElement.classList.add('dark')
    else
      document.documentElement.classList.remove('dark')
  }, { immediate: true })

  return {
    sidebarOpen,
    sidebarCollapsed,
    isDark,
    themeTokens,
    toggleDark,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setSidebarCollapsed,
    toggleSidebarCollapsed,
    fetchTheme,
    setTheme,
  }
})
