<script setup lang="ts">
import { useDateFormat, useIntervalFn, useNow } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import AccountModal from '@/components/AccountModal.vue'
import routes from '@/router/routes'
import { getPlatformIcon, useAccountStore } from '@/stores/account'

import { useAppStore } from '@/stores/app'
import { useStatusStore } from '@/stores/status'
import RemarkModal from './RemarkModal.vue'
import ThemeToggle from './ThemeToggle.vue'

const accountStore = useAccountStore()
const statusStore = useStatusStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const { accounts, currentAccount } = storeToRefs(accountStore)
const { status, realtimeConnected } = storeToRefs(statusStore)
const { sidebarCollapsed, sidebarOpen } = storeToRefs(appStore)

const showAccountModal = ref(false)
const showRemarkModal = ref(false)
const accountToEdit = ref<any>(null)
const wsErrorNotifiedAt = ref<Record<string, number>>({})

const systemConnected = ref(true)
const serverUptimeBase = ref(0)
const serverVersion = ref('')
const lastPingTime = ref(Date.now())
const now = useNow()
const formattedTime = useDateFormat(now, 'YYYY-MM-DD HH:mm:ss')

async function checkConnection() {
  try {
    const res = await authApi.ping()
    systemConnected.value = true
    if (res) {
      if (res.uptime) {
        serverUptimeBase.value = res.uptime
        lastPingTime.value = Date.now()
      }
      if (res.version) {
        serverVersion.value = res.version
      }
    }
    const accountRef = currentAccount.value?.id || currentAccount.value?.uin
    if (accountRef) {
      statusStore.connectRealtime(String(accountRef))
    }
  }
  catch {
    systemConnected.value = false
  }
}

async function refreshStatusFallback() {
  if (realtimeConnected.value)
    return

  const accountRef = currentAccount.value?.id || currentAccount.value?.uin
  if (accountRef) {
    await statusStore.fetchStatus(String(accountRef))
  }
}

async function handleAccountSaved() {
  await accountStore.fetchAccounts()
  await refreshStatusFallback()
  showAccountModal.value = false
  showRemarkModal.value = false
}

onMounted(() => {
  accountStore.fetchAccounts()
  checkConnection()
})

onBeforeUnmount(() => {
  statusStore.disconnectRealtime()
})

useIntervalFn(checkConnection, 30000)
useIntervalFn(() => {
  refreshStatusFallback()
  accountStore.fetchAccounts()
}, 10000)

watch(
  () => currentAccount.value?.id || currentAccount.value?.uin || '',
  () => {
    const accountRef = currentAccount.value?.id || currentAccount.value?.uin
    statusStore.connectRealtime(String(accountRef || ''))
    refreshStatusFallback()
  },
  { immediate: true },
)

watch(
  () => status.value?.wsError,
  (wsError: any) => {
    if (!wsError || Number(wsError.code) !== 400 || !currentAccount.value)
      return

    const errAt = Number(wsError.at) || 0
    const accId = String(currentAccount.value.id || currentAccount.value.uin || '')
    const lastNotified = wsErrorNotifiedAt.value[accId] || 0
    if (errAt <= lastNotified)
      return

    wsErrorNotifiedAt.value[accId] = errAt
    accountToEdit.value = currentAccount.value
    showAccountModal.value = true
  },
  { deep: true },
)

const uptime = computed(() => {
  const diff = Math.floor(serverUptimeBase.value + (now.value.getTime() - lastPingTime.value) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m}m ${s}s`
})

const platformIcon = computed(() => getPlatformIcon(currentAccount.value?.platform))

const displayInfo = computed(() => {
  const acc = currentAccount.value

  if (!acc) {
    return {
      primary: '选择账号',
      secondary: '',
    }
  }

  const liveName = status.value?.status?.name
  const isOnline = liveName && liveName !== '未登录'

  return {
    primary: isOnline
      ? liveName
      : (acc.nick),

    secondary: isOnline && acc.name
      ? acc.name
      : '',
  }
})

const selectedAccountId = computed({
  get: () => currentAccount.value?.id || '',
  set: (val: any) => {
    if (!val)
      return
    accountStore.selectAccount(String(val))
  },
})

const accountOptions = computed(() => {
  return (accounts.value || []).map((acc: any) => ({
    ...acc,
    label: acc.name || acc.nick || acc.uin || acc.id,
    value: String(acc.id),
  }))
})

const connectionStatus = computed(() => {
  if (!systemConnected.value) {
    return { text: '系统离线', badge: 'error' as const }
  }
  if (!currentAccount.value?.id) {
    return { text: '请添加账号', badge: 'default' as const }
  }
  if (status.value?.connection?.connected) {
    return { text: '运行中', badge: 'processing' as const }
  }
  return { text: '未连接', badge: 'default' as const }
})

const layoutRoute = routes.find(r => r.path === '/')
const menuItems = computed(() => {
  const children = layoutRoute?.children ?? []
  return children
    .filter(r => r.meta?.label)
    .map((r) => {
      const path = r.path ? `/${r.path}` : '/'
      return {
        key: path,
        icon: r.meta?.icon as string,
        label: r.meta!.label as string,
      }
    })
})

function onMenuClick(path: string) {
  router.push(path)
}

function isActive(path: string) {
  return route.path === path
}

function openRemarkForCurrent() {
  if (!currentAccount.value)
    return
  accountToEdit.value = currentAccount.value
  showRemarkModal.value = true
}

const version = __APP_VERSION__

watch(
  () => route.path,
  () => {
    if (window.innerWidth < 1024)
      appStore.closeSidebar()
  },
)
</script>

<template>
  <!-- Desktop sider -->
  <a-layout-sider
    class="hidden xl:block"
    :width="230"
    :collapsed-width="72"
    :collapsed="sidebarCollapsed"
    theme="light"
  >
    <div class="h-full flex flex-col a-bg-container">
      <!-- Brand -->
      <div
        class="brand-header h-12 flex shrink-0 items-center border-b border-b-solid a-border-b-border-sec"
        :class="sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-4'"
      >
        <div class="brand-icon relative flex items-center justify-center">
          <img src="/icon.ico" alt="" class="h-8 w-8 shrink-0">
        </div>
        <template v-if="!sidebarCollapsed">
          <span class="brand-title whitespace-nowrap text-lg font-bold tracking-wide font-serif">经典农场助手</span>
          <span class="brand-plus">PLUS</span>
          <span class="brand-sparkle text-xs">✦</span>
        </template>
      </div>

      <!-- Account (expanded) -->
      <div v-if="!sidebarCollapsed" class="px-3 py-3">
        <div class="overflow-hidden border rounded-xl border-solid shadow-sm a-border-border-sec">
          <div class="flex items-center gap-3 px-3 py-2.5 a-bg-primary-bg">
            <div class="relative">
              <a-avatar
                :size="40"
                :src="currentAccount?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100` : undefined"
                class="shrink-0 bg-green-2 ring-2"
              >
                <template #icon>
                  <div class="i-twemoji-farmer text-xl" />
                </template>
              </a-avatar>

              <div v-if="platformIcon" class="absolute shrink-0 text-[13px] text-primary -bottom-0.7 -right-1" :class="platformIcon" />
            </div>

            <div class="min-w-0 flex flex-1 flex-col gap-0.5">
              <div class="truncate text-base font-semibold leading-snug a-color-text">
                {{ displayInfo.primary }}
              </div>
              <div class="truncate text-sm leading-snug a-color-text-tertiary">
                {{ displayInfo.secondary }}
              </div>
            </div>
            <a-badge :status="connectionStatus.badge" />
          </div>
          <div class="px-3 py-2">
            <a-select
              v-if="accountOptions.length"
              v-model:value="selectedAccountId"
              :options="accountOptions"
              placeholder="切换账号..."
              size="small"
              class="w-full"
            >
              <template #optionRender="{ option }">
                <div class="flex items-center gap-1">
                  <i class="text-primary" :class="getPlatformIcon(option.data?.platform)" />
                  <a-avatar :size="18" :src="option.data?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${option.data.uin}&s=100` : undefined" class="bg-green-2">
                    <template #icon>
                      <div class="i-twemoji-farmer" />
                    </template>
                  </a-avatar>
                  <span>{{ option.data?.label }}</span>
                </div>
              </template>
            </a-select>
            <div v-else class="py-1 text-center text-sm a-color-text-tertiary">
              暂无账号
            </div>
            <div class="mt-1.5 flex items-center justify-between">
              <a-button
                size="small"
                type="link"
                class="!px-0 !text-sm"
                :disabled="!currentAccount"
                @click="openRemarkForCurrent"
              >
                修改备注
              </a-button>
              <a-button size="small" type="link" class="!px-0 !text-sm" @click="showAccountModal = true">
                + 添加账号
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Account (collapsed) -->
      <div v-if="sidebarCollapsed" class="flex justify-center py-3">
        <a-avatar
          :size="36"
          :src="currentAccount?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100` : undefined"
          class="shrink-0 bg-green-2 ring-2"
        >
          <template #icon>
            <div class="i-twemoji-farmer" />
          </template>
        </a-avatar>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 space-y-1.5" :class="sidebarCollapsed ? 'px-2' : ''">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="group flex cursor-pointer items-center rounded-lg transition-all duration-150"
          :class="[
            sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
            isActive(item.key)
              ? 'a-bg-primary-bg a-color-primary-text font-medium'
              : 'hover:a-bg-fill-tertiary a-color-text-secondary',
          ]"
          @click="onMenuClick(item.key)"
        >
          <div class="shrink-0 text-[17px]" :class="item.icon" />
          <span v-if="!sidebarCollapsed" class="truncate text-[14px]">{{ item.label }}</span>
        </div>
      </nav>

      <!-- Footer -->
      <div class="border-t border-t-solid px-3 py-3 a-border-t-border-sec">
        <template v-if="sidebarCollapsed">
          <div class="flex flex-col items-center gap-2.5">
            <a-badge :status="connectionStatus.badge" />
            <ThemeToggle />
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-sm a-color-text-tertiary">
              <div class="i-twemoji-timer-clock text-base" />
              {{ uptime }}
            </div>
            <ThemeToggle />
          </div>
          <div class="mt-1.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
            <span>{{ formattedTime }}</span>
          </div>
          <div class="mt-0.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
            <span>Web v{{ version }}</span>
            <span v-if="serverVersion">Core v{{ serverVersion }}</span>
          </div>
        </template>
      </div>
    </div>
  </a-layout-sider>

  <!-- Mobile drawer -->
  <a-drawer
    class="xl:hidden"
    placement="left"
    :open="sidebarOpen"
    :size="280"
    :closable="false"
    :styles="{ body: { padding: '0px' } }"
    @close="appStore.closeSidebar()"
  >
    <div class="h-full flex flex-col a-bg-container">
      <!-- Brand -->
      <div
        class="brand-header h-12 flex shrink-0 items-center gap-2 border-b border-b-solid px-4 a-border-b-border-sec"
      >
        <div class="brand-icon relative flex items-center justify-center">
          <img src="/icon.ico" alt="" class="h-8 w-8 shrink-0">
        </div>
        <span class="brand-title whitespace-nowrap text-lg font-bold tracking-wide font-serif">QQ农场助手</span>
        <span class="brand-plus">PLUS</span>
        <span class="brand-sparkle text-xs">✦</span>
      </div>

      <!-- Account -->
      <div class="px-3 py-3">
        <div class="overflow-hidden border rounded-xl border-solid shadow-sm a-border-border-sec">
          <div class="flex items-center gap-3 px-3 py-2.5 a-bg-primary-bg">
            <div class="relative">
              <a-avatar
                :size="40"
                :src="currentAccount?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100` : undefined"
                class="shrink-0 bg-green-2 ring-2"
              >
                <template #icon>
                  <div class="i-twemoji-farmer text-xl" />
                </template>
              </a-avatar>

              <div v-if="platformIcon" class="absolute shrink-0 text-[13px] text-primary -bottom-0.7 -right-1" :class="platformIcon" />
            </div>

            <div class="min-w-0 flex flex-1 flex-col gap-0.5">
              <div class="truncate text-base font-semibold leading-snug a-color-text">
                {{ displayInfo.primary }}
              </div>
              <div class="truncate text-sm leading-snug a-color-text-tertiary">
                {{ displayInfo.secondary }}
              </div>
            </div>
            <a-badge :status="connectionStatus.badge" />
          </div>
          <div class="px-3 py-2">
            <a-select
              v-if="accountOptions.length"
              v-model:value="selectedAccountId"
              :options="accountOptions"
              placeholder="切换账号..."
              size="small"
              class="w-full"
            >
              <template #optionRender="{ option }">
                <div class="flex items-center gap-2">
                  <i class="text-primary" :class="getPlatformIcon(option.data?.platform)" />
                  <a-avatar :size="18" :src="option.data?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${option.data.uin}&s=100` : undefined" class="bg-green-2">
                    <template #icon>
                      <div class="i-twemoji-farmer" />
                    </template>
                  </a-avatar>
                  <span>{{ option.data?.label }}</span>
                </div>
              </template>
            </a-select>
            <div v-else class="py-1 text-center text-sm a-color-text-tertiary">
              暂无账号
            </div>
            <div class="mt-1.5 flex items-center justify-between">
              <a-button
                size="small"
                type="link"
                class="!px-0 !text-sm"
                :disabled="!currentAccount"
                @click="openRemarkForCurrent"
              >
                修改备注
              </a-button>
              <a-button size="small" type="link" class="!px-0 !text-sm" @click="showAccountModal = true">
                + 添加账号
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 space-y-0.5">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150"
          :class="
            isActive(item.key)
              ? 'a-bg-primary-bg a-color-primary-text font-medium'
              : 'hover:a-bg-fill-tertiary a-color-text-secondary'
          "
          @click="onMenuClick(item.key)"
        >
          <div class="text-[17px]" :class="item.icon" />
          <span class="text-[13px]">{{ item.label }}</span>
        </div>
      </nav>

      <!-- Footer -->
      <div class="border-t border-t-solid px-3 py-3 a-border-t-border-sec">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-sm a-color-text-tertiary">
            <div class="i-twemoji-timer-clock text-base" />
            {{ uptime }}
          </div>
          <ThemeToggle />
        </div>
        <div class="mt-1.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
          <span>{{ formattedTime }}</span>
        </div>
        <div class="mt-0.5 flex items-center justify-between text-xs font-mono a-color-text-tertiary">
          <span>Web v{{ version }}</span>
          <span v-if="serverVersion">Core v{{ serverVersion }}</span>
        </div>
      </div>
    </div>
  </a-drawer>

  <AccountModal
    :show="showAccountModal"
    :edit-data="accountToEdit"
    @close="((showAccountModal = false), (accountToEdit = null))"
    @saved="handleAccountSaved"
  />

  <RemarkModal
    :show="showRemarkModal"
    :account="accountToEdit"
    @close="showRemarkModal = false"
    @saved="handleAccountSaved"
  />
</template>

<style scoped>
.brand-title {
  background: linear-gradient(135deg, #15803d 0%, #22c55e 50%, #16a34a 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-plus {
  display: inline-flex;
  align-items: center;
  padding: 0 5px;
  height: 16px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  border-radius: 4px;
  background: linear-gradient(135deg, #15803d 0%, #22c55e 50%, #16a34a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(34, 197, 94, 0.3);
  color: #fff;
}

.brand-sparkle {
  color: #4ade80;
  animation: sparkle-pulse 2.4s ease-in-out infinite;
}

@keyframes sparkle-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-sparkle {
    animation: none;
    opacity: 0.6;
  }
}

/* 暗色模式 */
:deep(.dark) .brand-title,
.dark .brand-title {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.dark) .brand-plus,
.dark .brand-plus {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #6ee7b7 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 1px rgba(74, 222, 128, 0.3);
  color: #052e16;
}

:deep(.dark) .brand-sparkle,
.dark .brand-sparkle {
  color: #86efac;
}
</style>
