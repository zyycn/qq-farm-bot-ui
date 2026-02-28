<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AccountModal from '@/components/AccountModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getPlatformClass, getPlatformLabel, useAccountStore } from '@/stores/account'

const router = useRouter()
const accountStore = useAccountStore()
const { accounts, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const editingAccount = ref<any>(null)
const accountToDelete = ref<any>(null)

onMounted(() => accountStore.fetchAccounts())
useIntervalFn(() => accountStore.fetchAccounts(), 3000)

function openSettings(account: any) {
  accountStore.selectAccount(account.id)
  router.push('/settings')
}

function openAddModal() {
  editingAccount.value = null
  showModal.value = true
}

function openEditModal(account: any) {
  editingAccount.value = { ...account }
  showModal.value = true
}

async function handleDelete(account: any) {
  accountToDelete.value = account
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (accountToDelete.value) {
    try {
      deleteLoading.value = true
      await accountStore.deleteAccount(accountToDelete.value.id)
      accountToDelete.value = null
      showDeleteConfirm.value = false
    }
    finally {
      deleteLoading.value = false
    }
  }
}

async function toggleAccount(account: any) {
  if (account.running)
    await accountStore.stopAccount(account.id)
  else await accountStore.startAccount(account.id)
}

function handleSaved() {
  accountStore.fetchAccounts()
}

function getAvatar(acc: any) {
  return acc.uin ? `https://q1.qlogo.cn/g?b=qq&nk=${acc.uin}&s=100` : undefined
}

function getDisplayName(acc: any) {
  return acc.name || acc.nick || acc.id
}
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-base font-bold a-color-text">
        <div class="i-twemoji-bust-in-silhouette text-lg" />
        账号管理
        <span v-if="accounts.length" class="ml-1 text-sm font-normal a-color-text-tertiary">{{ accounts.length }} 个账号</span>
      </div>
      <a-button type="primary" @click="openAddModal">
        <template #icon>
          <div class="i-twemoji-plus text-base" />
        </template>
        添加账号
      </a-button>
    </div>

    <a-spin v-if="loading && accounts.length === 0" class="flex-1 items-center justify-center !flex" />

    <div v-else-if="accounts.length === 0" class="flex flex-1 flex-col items-center justify-center gap-4">
      <div class="i-twemoji-bust-in-silhouette text-6xl opacity-20" />
      <div class="text-center">
        <div class="text-base font-medium a-color-text-secondary">
          暂无账号
        </div>
        <div class="mt-1 text-sm a-color-text-tertiary">
          添加一个账号开始自动化管理农场
        </div>
      </div>
    </div>

    <!-- Account Cards -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="acc in accounts"
          :key="acc.id"
          class="group overflow-hidden border rounded-xl border-solid transition-all a-bg-container a-border-border-sec hover:shadow-md"
        >
          <!-- Status banner -->
          <div
            class="flex items-center justify-between px-4 py-1.5 text-sm font-medium"
            :class="acc.running ? 'a-bg-primary-bg a-color-primary-text' : 'a-bg-fill-tertiary a-color-text-secondary'"
          >
            <div class="flex items-center gap-1.5">
              <div
                class="h-1.5 w-1.5 rounded-full"
                :class="acc.running ? 'a-bg-success animate-pulse' : 'a-bg-fill-tertiary'"
              />
              {{ acc.running ? '运行中' : '已停止' }}
            </div>
            <span class="text-xs opacity-60">ID: {{ acc.id }}</span>
          </div>

          <!-- Body -->
          <div class="px-4 py-3">
            <div class="flex items-center gap-3">
              <a-avatar
                :size="46"
                :src="getAvatar(acc)"
                class="shrink-0 shadow-sm ring-2"
                style="--un-ring-color: var(--ant-color-bg-container)"
              >
                <template #icon>
                  <div class="i-twemoji-farmer text-xl" />
                </template>
              </a-avatar>
              <div class="min-w-0 flex-1">
                <div class="truncate text-base font-bold a-color-text">
                  {{ getDisplayName(acc) }}
                </div>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <span
                    v-if="acc.platform"
                    class="rounded px-1 py-0.5 text-xs font-medium leading-tight"
                    :class="getPlatformClass(acc.platform)"
                  >
                    {{ getPlatformLabel(acc.platform) }}
                  </span>
                  <span class="text-sm a-color-text-tertiary">
                    {{ acc.uin || '未绑定' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-4 gap-1.5 px-3 pb-3 text-sm">
            <a-button
              color="primary"
              variant="filled"
              @click="toggleAccount(acc)"
            >
              <div class="text-base" :class="acc.running ? 'i-twemoji-stop-button' : 'i-twemoji-play-button'" />
              {{ acc.running ? '停止' : '启动' }}
            </a-button>
            <a-button
              color="primary"
              variant="filled"
              @click="openSettings(acc)"
            >
              <div class="i-twemoji-gear text-base" />
              设置
            </a-button>
            <a-button
              color="primary"
              variant="filled"
              @click="openEditModal(acc)"
            >
              <div class="i-twemoji-memo text-base" />
              编辑
            </a-button>
            <a-button
              color="primary"
              variant="filled"
              @click="handleDelete(acc)"
            >
              <div class="i-twemoji-wastebasket text-base" />
              删除
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <AccountModal :show="showModal" :edit-data="editingAccount" @close="showModal = false" @saved="handleSaved" />

    <ConfirmModal
      :show="showDeleteConfirm"
      :loading="deleteLoading"
      title="删除账号"
      :message="accountToDelete ? `确定要删除账号 ${accountToDelete.name || accountToDelete.id} 吗?` : ''"
      confirm-text="删除"
      type="danger"
      @close="!deleteLoading && (showDeleteConfirm = false)"
      @cancel="!deleteLoading && (showDeleteConfirm = false)"
      @confirm="confirmDelete"
    />
  </div>
</template>
