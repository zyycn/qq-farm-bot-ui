<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import LandCard from '@/components/LandCard.vue'
import { useAccountStore } from '@/stores/account'
import { useFriendStore } from '@/stores/friend'
import { useStatusStore } from '@/stores/status'

const accountStore = useAccountStore()
const friendStore = useFriendStore()
const statusStore = useStatusStore()
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { friends, loading, friendLands, friendLandsLoading, blacklist } = storeToRefs(friendStore)
const { status, loading: statusLoading, realtimeConnected } = storeToRefs(statusStore)

const showConfirm = ref(false)
const confirmMessage = ref('')
const confirmLoading = ref(false)
const pendingAction = ref<(() => Promise<void>) | null>(null)
const avatarErrorKeys = ref<Set<string>>(new Set())
const searchQuery = ref('')

const connected = computed(() => status.value?.connection?.connected)
const blacklistedCount = computed(() => friends.value.filter(f => blacklist.value.includes(Number(f.gid))).length)

const filteredFriends = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return friends.value
  return friends.value.filter(
    f => (f.name || '').toLowerCase().includes(q) || String(f.uin || '').includes(q) || String(f.gid || '').includes(q),
  )
})

function confirmAction(msg: string, action: () => Promise<void>) {
  confirmMessage.value = msg
  pendingAction.value = action
  showConfirm.value = true
}

async function onConfirm() {
  if (pendingAction.value) {
    try {
      confirmLoading.value = true
      await pendingAction.value()
      pendingAction.value = null
      showConfirm.value = false
    }
    finally {
      confirmLoading.value = false
    }
  }
  else {
    showConfirm.value = false
  }
}

const expandedFriends = ref<Set<string>>(new Set())

async function loadFriends() {
  if (currentAccountId.value) {
    const acc = currentAccount.value
    if (!acc)
      return
    if (!realtimeConnected.value)
      await statusStore.fetchStatus(currentAccountId.value)
    if (acc.running && status.value?.connection?.connected) {
      avatarErrorKeys.value.clear()
      friendStore.fetchFriends(currentAccountId.value)
      friendStore.fetchBlacklist(currentAccountId.value)
    }
  }
}

useIntervalFn(() => {
  for (const gid in friendLands.value) {
    if (friendLands.value[gid]) {
      friendLands.value[gid] = friendLands.value[gid].map((l: any) =>
        l.matureInSec > 0 ? { ...l, matureInSec: l.matureInSec - 1 } : l,
      )
    }
  }
}, 1000)

onMounted(() => loadFriends())
watch(currentAccountId, () => {
  expandedFriends.value.clear()
  loadFriends()
})
useIntervalFn(() => loadFriends(), 30000)

function toggleFriend(friendId: string) {
  if (expandedFriends.value.has(friendId)) {
    expandedFriends.value.delete(friendId)
  }
  else {
    expandedFriends.value.clear()
    expandedFriends.value.add(friendId)
    if (currentAccountId.value && currentAccount.value?.running && connected.value)
      friendStore.fetchFriendLands(currentAccountId.value, friendId)
  }
}

async function handleOp(friendId: string, type: string, e: Event) {
  e.stopPropagation()
  if (!currentAccountId.value)
    return
  confirmAction('确定执行此操作吗?', async () => {
    await friendStore.operate(currentAccountId.value!, friendId, type)
  })
}

async function handleToggleBlacklist(friend: any, e: Event) {
  e.stopPropagation()
  if (!currentAccountId.value)
    return
  await friendStore.toggleBlacklist(currentAccountId.value, Number(friend.gid))
}

function getFriendStatusTags(friend: any) {
  const p = friend.plant || {}
  const tags: { label: string, icon: string, class: string }[] = []
  if (p.stealNum) {
    tags.push({
      label: `可偷 ${p.stealNum}`,
      icon: 'i-twemoji-pinching-hand',
      class: 'a-bg-fill-tertiary a-color-text-secondary',
    })
  }
  if (p.dryNum) {
    tags.push({ label: `浇水 ${p.dryNum}`, icon: 'i-twemoji-droplet', class: 'a-bg-fill-tertiary a-color-info' })
  }
  if (p.weedNum) {
    tags.push({ label: `除草 ${p.weedNum}`, icon: 'i-twemoji-herb', class: 'a-bg-fill-tertiary a-color-success' })
  }
  if (p.insectNum) {
    tags.push({ label: `除虫 ${p.insectNum}`, icon: 'i-twemoji-bug', class: 'a-bg-fill-tertiary a-color-warning' })
  }
  return tags
}

function getFriendAvatar(friend: any) {
  const direct = String(friend?.avatarUrl || friend?.avatar_url || '').trim()
  if (direct)
    return direct
  const uin = String(friend?.uin || '').trim()
  if (uin)
    return `https://q1.qlogo.cn/g?b=qq&nk=${uin}&s=100`
  return ''
}

function getFriendAvatarKey(friend: any) {
  return String(friend?.gid || friend?.uin || '').trim() || String(friend?.name || '').trim()
}

function canShowFriendAvatar(friend: any) {
  const key = getFriendAvatarKey(friend)
  if (!key)
    return false
  return !!getFriendAvatar(friend) && !avatarErrorKeys.value.has(key)
}

const opButtons = [
  { type: 'steal', label: '偷取', icon: 'i-twemoji-pinching-hand' },
  { type: 'water', label: '浇水', icon: 'i-twemoji-droplet' },
  { type: 'weed', label: '除草', icon: 'i-twemoji-herb' },
  { type: 'bug', label: '除虫', icon: 'i-twemoji-bug' },
  { type: 'bad', label: '捣乱', icon: 'i-twemoji-smiling-face-with-horns' },
]
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-center gap-2 text-base font-bold a-color-text">
      <div class="i-twemoji-people-hugging text-lg" />
      好友农场
    </div>

    <a-spin v-if="loading || statusLoading" class="flex-1 items-center justify-center !flex" />

    <div v-else-if="!currentAccountId" class="flex flex-1 flex-col items-center justify-center gap-3">
      <div class="i-twemoji-people-hugging text-5xl opacity-30" />
      <div class="text-base a-color-text-tertiary">
        请先在侧边栏选择账号
      </div>
    </div>

    <div v-else-if="!connected" class="flex flex-1 flex-col items-center justify-center gap-3">
      <div class="i-twemoji-warning text-4xl" />
      <div class="text-base a-color-text-secondary">
        账号未连接，请先运行账号
      </div>
    </div>

    <div v-else-if="friends.length === 0" class="flex flex-1 flex-col items-center justify-center gap-3">
      <div class="i-twemoji-person-shrugging text-5xl opacity-40" />
      <div class="text-base a-color-text-tertiary">
        暂无好友数据
      </div>
    </div>

    <!-- Friend List -->
    <a-card
      v-else
      variant="borderless"
      class="flex-1 overflow-hidden"
      :classes="{ body: '!p-0 !h-full !flex !flex-col' }"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b border-b-solid px-4 py-2.5 a-border-b-border-sec"
      >
        <div class="flex items-center gap-2 text-sm a-color-text-tertiary">
          <span class="rounded-md px-2 py-0.5 font-medium a-color-primary-text a-bg-primary-bg">{{ friends.length }} 好友</span>
          <span v-if="blacklistedCount" class="rounded-md px-2 py-0.5 a-color-text-secondary a-bg-fill-secondary">{{ blacklistedCount }} 屏蔽</span>
        </div>
        <a-input v-model:value="searchQuery" placeholder="搜索好友..." allow-clear class="!w-48">
          <template #prefix>
            <div class="i-twemoji-magnifying-glass-tilted-left text-base" />
          </template>
        </a-input>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="filteredFriends.length === 0" class="flex flex-col items-center justify-center gap-2 py-16">
          <div class="i-twemoji-magnifying-glass-tilted-left text-3xl opacity-30" />
          <div class="text-base a-color-text-tertiary">
            未找到匹配的好友
          </div>
        </div>

        <div
          v-for="(friend, idx) in filteredFriends"
          :key="friend.gid"
          class="transition-colors"
          :class="[
            idx > 0 ? 'border-t border-t-solid a-border-t-border-sec' : '',
            blacklist.includes(Number(friend.gid)) ? 'opacity-50' : 'opacity-100',
          ]"
        >
          <!-- Friend Row -->
          <div
            class="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
            :class="expandedFriends.has(friend.gid) ? 'a-bg-primary-bg' : 'bg-transparent hover:a-bg-fill-tertiary'"
            @click="toggleFriend(friend.gid)"
          >
            <a-avatar
              :size="38"
              :src="canShowFriendAvatar(friend) ? getFriendAvatar(friend) : undefined"
              class="shrink-0 shadow-sm ring-2"
              style="--un-ring-color: var(--ant-color-bg-container)"
              @error="
                () => {
                  avatarErrorKeys.add(getFriendAvatarKey(friend))
                }
              "
            >
              <template #icon>
                <div class="i-twemoji-farmer" />
              </template>
            </a-avatar>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-base font-semibold a-color-text">{{ friend.name }}</span>
                <a-tag v-if="blacklist.includes(Number(friend.gid))" size="small" color="default">
                  屏蔽
                </a-tag>
              </div>
              <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
                <template v-if="getFriendStatusTags(friend).length">
                  <div
                    v-for="tag in getFriendStatusTags(friend)"
                    :key="tag.label"
                    class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
                    :class="tag.class"
                  >
                    <div class="text-sm" :class="tag.icon" />
                    {{ tag.label }}
                  </div>
                </template>
                <span v-else class="text-sm a-color-text-tertiary">无可操作</span>
              </div>
            </div>

            <!-- Operations (desktop) -->
            <div class="hidden items-center gap-1 sm:flex">
              <a-tooltip v-for="op in opButtons" :key="op.type" :title="op.label" placement="top">
                <a-button
                  class="flex items-center justify-center border rounded-lg border-solid p-1.5 text-base transition-all a-bg-container a-border-border active:scale-95 hover:shadow-sm"
                  @click="handleOp(friend.gid, op.type, $event)"
                >
                  <div :class="op.icon" />
                </a-button>
              </a-tooltip>
              <a-tooltip :title="blacklist.includes(Number(friend.gid)) ? '移出黑名单' : '加入黑名单'" placement="top">
                <a-button
                  class="ml-1 flex items-center justify-center rounded-lg p-1.5 text-base transition-all active:scale-95"
                  :class="
                    blacklist.includes(Number(friend.gid))
                      ? 'border border-solid a-border-success a-bg-primary-bg'
                      : 'border border-solid a-border-border a-bg-container'
                  "
                  @click="handleToggleBlacklist(friend, $event)"
                >
                  <div
                    :class="
                      blacklist.includes(Number(friend.gid)) ? 'i-twemoji-check-mark-button' : 'i-twemoji-prohibited'
                    "
                  />
                </a-button>
              </a-tooltip>
            </div>

            <div
              class="transition-transform a-color-text-tertiary"
              :class="expandedFriends.has(friend.gid) ? 'rotate-90' : ''"
            >
              <div class="i-carbon-chevron-right text-base" />
            </div>
          </div>

          <!-- Mobile operations -->
          <div
            v-if="expandedFriends.has(friend.gid)"
            class="flex flex-wrap gap-1.5 border-t border-dashed border-t-solid px-4 py-2 a-border-t-border-sec sm:hidden"
          >
            <a-button
              v-for="op in opButtons"
              :key="op.type"
              class="flex items-center gap-1 border rounded-lg border-solid px-2 py-1 text-sm transition-all a-bg-container a-border-border active:scale-95"
              @click="handleOp(friend.gid, op.type, $event)"
            >
              <div class="text-base" :class="op.icon" />
              {{ op.label }}
            </a-button>
            <a-button
              class="flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-all active:scale-95"
              :class="
                blacklist.includes(Number(friend.gid))
                  ? 'border border-solid a-border-success a-bg-primary-bg'
                  : 'border border-solid a-border-border a-bg-container'
              "
              @click="handleToggleBlacklist(friend, $event)"
            >
              <div
                class="text-base"
                :class="blacklist.includes(Number(friend.gid)) ? 'i-twemoji-check-mark-button' : 'i-twemoji-prohibited'"
              />
              {{ blacklist.includes(Number(friend.gid)) ? '取消屏蔽' : '屏蔽' }}
            </a-button>
          </div>

          <!-- Expanded Lands -->
          <div
            v-if="expandedFriends.has(friend.gid)"
            class="border-t border-t-solid px-4 py-3 a-bg-fill-tertiary a-border-t-border-sec"
          >
            <a-spin v-if="friendLandsLoading[friend.gid]" class="py-4 !block" />
            <a-empty
              v-else-if="!friendLands[friend.gid] || friendLands[friend.gid]?.length === 0"
              description="无土地数据"
              :image-style="{ height: '36px' }"
            />
            <div v-else class="grid grid-cols-2 gap-2 lg:grid-cols-8 md:grid-cols-5 sm:grid-cols-4">
              <LandCard v-for="land in friendLands[friend.gid]" :key="land.id" :land="land" />
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <ConfirmModal
      :show="showConfirm"
      :loading="confirmLoading"
      title="确认操作"
      :message="confirmMessage"
      @confirm="onConfirm"
      @cancel="!confirmLoading && (showConfirm = false)"
    />
  </div>
</template>
