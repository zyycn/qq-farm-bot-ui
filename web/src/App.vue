<script setup lang="ts">
import { theme } from 'antdv-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark, themeTokens } = storeToRefs(appStore)

const themeConfig = computed(() => ({
  algorithm: isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: themeTokens.value.colorPrimary,
    colorSuccess: themeTokens.value.colorSuccess,
    colorWarning: themeTokens.value.colorWarning,
    colorError: themeTokens.value.colorError,
    colorInfo: themeTokens.value.colorInfo,
    colorLink: themeTokens.value.colorLink,
    borderRadius: themeTokens.value.borderRadius,
  },
}))
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <RouterView />
  </a-config-provider>
</template>

<style>
body {
  margin: 0;
  font-family: 'DM Sans', sans-serif;
}

.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition:
    background-color 0.3s ease,
    color 0.2s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease !important;
}
</style>
