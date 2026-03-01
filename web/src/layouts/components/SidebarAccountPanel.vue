<script setup lang="ts">
import QqAvatar from '@/components/QqAvatar.vue'
import { getPlatformIcon } from '@/stores'

defineProps<{
  collapsed?: boolean
  displayInfo: { primary: string, secondary: string }
  connectionStatus: { text: string, badge: 'error' | 'default' | 'processing' }
  accountOptions: any[]
  currentAccount: any
}>()

const emit = defineEmits<{
  openRemark: []
  addAccount: []
}>()

const selectedAccountId = defineModel<any>('selectedAccountId', { required: true })
</script>

<template>
  <!-- Expanded -->
  <div v-if="!collapsed" class="px-3 py-3">
    <div class="overflow-hidden border rounded-xl border-solid shadow-sm a-border-border-sec">
      <div class="flex items-center gap-3 px-3 py-2.5 a-bg-primary-bg">
        <QqAvatar :uin="currentAccount?.uin" :size="40" ring :platform="currentAccount?.platform" />

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
              <QqAvatar :uin="option.data?.uin" :size="18" />
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
            @click="emit('openRemark')"
          >
            修改备注
          </a-button>
          <a-button size="small" type="link" class="!px-0 !text-sm" @click="emit('addAccount')">
            + 添加账号
          </a-button>
        </div>
      </div>
    </div>
  </div>

  <!-- Collapsed -->
  <div v-else class="flex justify-center py-3">
    <QqAvatar :uin="currentAccount?.uin" :size="36" ring />
  </div>
</template>
