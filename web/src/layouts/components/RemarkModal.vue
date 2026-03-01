<script setup lang="ts">
import { ref, watch } from 'vue'
import { accountApi } from '@/api'
import QqAvatar from '@/components/QqAvatar.vue'

const props = defineProps<{
  show: boolean
  account?: any
}>()

const emit = defineEmits(['close', 'saved'])

function handleClose() {
  emit('close')
}

const name = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(
  () => props.show,
  (val) => {
    errorMessage.value = ''
    if (val && props.account) {
      name.value = props.account.name || ''
    }
  },
)

async function save() {
  if (!props.account)
    return
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = {
      id: props.account.id,
      name: name.value,
    }

    await accountApi.saveAccount(payload)
    emit('saved')
    emit('close')
  }
  catch (e: any) {
    errorMessage.value = `保存失败: ${e.message}`
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <a-modal
    :open="show"
    :footer="null"
    :width="380"
    :mask-closable="!loading"
    destroy-on-hidden
    @cancel="handleClose"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <div class="i-twemoji-label text-lg" />
        <span>修改备注</span>
      </div>
    </template>

    <div
      v-if="errorMessage"
      class="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-base opacity-90 a-color-white a-bg-error"
    >
      <div class="i-twemoji-warning shrink-0 text-base" />
      {{ errorMessage }}
    </div>

    <div v-if="account" class="mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 a-bg-fill-tertiary">
      <QqAvatar :uin="account.uin" :size="36" ring />
      <div class="min-w-0 flex flex-1 flex-col gap-0.5">
        <div class="truncate font-medium">
          {{ account.nick }}
        </div>
        <div class="text-sm a-color-text-tertiary">
          {{ account.name || account.uid || '未命名' }}
        </div>
      </div>
    </div>

    <a-form layout="vertical">
      <a-form-item label="备注名称">
        <a-input v-model:value="name" placeholder="请输入备注名称" @press-enter="save">
          <template #prefix>
            <div class="i-twemoji-memo text-base" />
          </template>
        </a-input>
      </a-form-item>
    </a-form>

    <div class="flex items-center justify-end gap-2 a-border-t-border-sec">
      <a-button :disabled="loading" @click="handleClose">
        取消
      </a-button>
      <a-button type="primary" :loading="loading" @click="save">
        <template v-if="!loading" #icon>
          <div class="i-twemoji-check-mark-button text-base" />
        </template>
        保存
      </a-button>
    </div>
  </a-modal>
</template>
