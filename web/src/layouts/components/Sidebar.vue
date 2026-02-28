<script setup lang="ts">
import { UserOutlined } from '@antdv-next/icons'
import { useDateFormat, useIntervalFn, useNow } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import AccountModal from '@/components/AccountModal.vue'
import routes from '@/router/routes'
import { useAccountStore } from '@/stores/account'

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
    if (res.data.ok && res.data.data) {
      if (res.data.data.uptime) {
        serverUptimeBase.value = res.data.data.uptime
        lastPingTime.value = Date.now()
      }
      if (res.data.data.version) {
        serverVersion.value = res.data.data.version
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

const displayName = computed(() => {
  const acc = currentAccount.value
  if (!acc)
    return '选择账号'

  const liveName = status.value?.status?.name
  if (liveName && liveName !== '未登录')
    return liveName

  if (acc.name)
    return acc.name

  if (acc.nick)
    return acc.nick

  return acc.uin
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
    label: acc.name || acc.nick || acc.uin || acc.id,
    value: String(acc.id),
    uin: acc.uin,
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
    class="hidden lg:block"
    :width="256"
    :collapsed-width="72"
    :collapsed="sidebarCollapsed"
    theme="light"
  >
    <div class="h-full flex flex-col a-bg-container">
      <!-- Brand -->
      <div
        class="h-12 flex shrink-0 items-center border-b border-b-solid px-4 a-border-b-border-sec"
        :class="sidebarCollapsed ? 'justify-center' : 'gap-2.5'"
      >
        <div class="i-twemoji-seedling shrink-0 text-xl" />
        <span v-if="!sidebarCollapsed" class="text-lg font-bold a-color-text">QQ农场助手</span>
      </div>

      <!-- Account (expanded) -->
      <div v-if="!sidebarCollapsed" class="px-3 py-3">
        <div class="overflow-hidden border rounded-xl border-solid shadow-sm a-border-border-sec">
          <div class="flex items-center gap-3 px-3 py-2.5 a-bg-primary-bg">
            <a-avatar
              :size="40"
              :src="currentAccount?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100` : undefined"
              class="shrink-0 shadow-sm ring-2"
              style="--un-ring-color: var(--ant-color-bg-container)"
            >
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            <div class="min-w-0 flex-1">
              <div class="truncate text-base font-semibold leading-snug a-color-text">
                {{ displayName }}
              </div>
              <div class="truncate text-sm a-color-text-tertiary">
                {{ currentAccount?.uin || '未选择账号' }}
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
              show-search
              option-filter-prop="label"
              size="small"
              class="w-full"
            >
              <template #option="{ label: optLabel, uin }">
                <div class="flex items-center gap-2">
                  <a-avatar :size="18" :src="uin ? `https://q1.qlogo.cn/g?b=qq&nk=${uin}&s=100` : undefined">
                    <template #icon>
                      <UserOutlined />
                    </template>
                  </a-avatar>
                  <span>{{ optLabel }}</span>
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
          class="cursor-pointer shadow-sm ring-2 transition-shadow hover:shadow"
          style="--un-ring-color: var(--ant-color-primary-bg)"
        >
          <template #icon>
            <UserOutlined />
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
    class="lg:hidden"
    placement="left"
    :open="sidebarOpen"
    :size="280"
    :styles="{ body: { padding: '0px' } }"
    @close="appStore.closeSidebar()"
  >
    <div class="h-full flex flex-col a-bg-container">
      <!-- Brand -->
      <div
        class="flex shrink-0 items-center gap-2.5 border-b border-b-solid px-4 a-border-b-border-sec"
        style="height: 48px"
      >
        <div class="i-twemoji-seedling text-xl" />
        <span class="text-base font-bold a-color-text">QQ农场助手</span>
      </div>

      <!-- Account -->
      <div class="px-3 py-3">
        <div class="overflow-hidden border rounded-xl border-solid shadow-sm a-border-border-sec">
          <div class="flex items-center gap-3 px-3 py-2.5 a-bg-primary-bg">
            <a-avatar
              :size="40"
              :src="currentAccount?.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${currentAccount.uin}&s=100` : undefined"
              class="shrink-0 shadow-sm ring-2"
              style="--un-ring-color: var(--ant-color-bg-container)"
            >
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            <div class="min-w-0 flex-1">
              <div class="truncate text-base font-semibold leading-snug a-color-text">
                {{ displayName }}
              </div>
              <div class="truncate text-sm a-color-text-tertiary">
                {{ currentAccount?.uin || '未选择账号' }}
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
              show-search
              option-filter-prop="label"
              size="small"
              class="w-full"
            >
              <template #option="{ label: optLabel, uin }">
                <div class="flex items-center gap-2">
                  <a-avatar :size="18" :src="uin ? `https://q1.qlogo.cn/g?b=qq&nk=${uin}&s=100` : undefined">
                    <template #icon>
                      <UserOutlined />
                    </template>
                  </a-avatar>
                  <span>{{ optLabel }}</span>
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
