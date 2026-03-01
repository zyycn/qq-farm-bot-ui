<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import { accountApi } from '@/api'

const props = defineProps<{
  show: boolean
  editData?: any
}>()

const emit = defineEmits(['close', 'saved'])

const activeTab = ref('qr')
const loading = ref(false)
const qrData = ref<{ image?: string, code: string, qrcode?: string, url?: string } | null>(null)
const qrStatus = ref('')
const errorMessage = ref('')

const form = reactive({
  name: '',
  code: '',
  platform: 'qq',
})

const { pause: stopQRCheck, resume: startQRCheck } = useIntervalFn(
  async () => {
    if (!qrData.value)
      return
    try {
      const res = await accountApi.checkQR(qrData.value.code)
      const status = res.status
      if (status === 'OK') {
        stopQRCheck()
        qrStatus.value = '登录成功!'
        const { uin, code: authCode, nickname } = res

        let accName = form.name.trim()
        if (!accName) {
          accName = nickname || (uin ? String(uin) : '扫码账号')
        }

        await addAccount({
          id: props.editData?.id,
          uin,
          code: authCode,
          loginType: 'qr',
          name: props.editData ? props.editData.name || accName : accName,
          platform: 'qq',
        })
      }
      else if (status === 'Used') {
        qrStatus.value = '二维码已失效'
        stopQRCheck()
      }
      else if (status === 'Wait') {
        qrStatus.value = '等待扫码...'
      }
      else {
        qrStatus.value = `错误: ${res.error || '未知'}`
      }
    }
    catch (e) {
      console.error(e)
    }
  },
  1000,
  { immediate: false },
)

async function loadQRCode() {
  if (activeTab.value !== 'qr')
    return
  loading.value = true
  qrStatus.value = '正在获取二维码'
  errorMessage.value = ''
  try {
    const res = await accountApi.createQR()
    qrData.value = res
    qrStatus.value = '请使用手机QQ扫码'
    startQRCheck()
  }
  catch (e: any) {
    qrStatus.value = `获取失败: ${e.message}`
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

const isMobile = computed(() => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent))

function openQRCodeLoginUrl() {
  if (!qrData.value?.url)
    return

  const url = qrData.value.url
  if (!isMobile.value) {
    window.open(url, '_blank')
    return
  }

  try {
    const b64 = btoa(unescape(encodeURIComponent(url)))
    const qqDeepLink = `mqqapi://forward/url?url_prefix=${encodeURIComponent(b64)}&version=1&src_type=web`
    window.location.href = qqDeepLink
  }
  catch (e) {
    console.error('深度链接错误:', e)
    window.location.href = url
  }
}

async function addAccount(data: any) {
  loading.value = true
  errorMessage.value = ''
  try {
    await accountApi.saveAccount(data)
    emit('saved')
    close()
  }
  catch (e: any) {
    errorMessage.value = `保存失败: ${e.message}`
  }
  finally {
    loading.value = false
  }
}

async function submitManual() {
  errorMessage.value = ''
  if (!form.code) {
    errorMessage.value = '请输入Code 或 先扫码'
    return
  }

  if (!form.name && props.editData) {
    errorMessage.value = '请输入名称'
    return
  }

  let code = form.code.trim()
  const match = code.match(/[?&]code=([^&]+)/i)
  if (match && match[1]) {
    code = decodeURIComponent(match[1])
    form.code = code
  }

  let payload = {}
  if (props.editData) {
    const onlyNameChanged = form.name !== props.editData.name
      && form.code === (props.editData.code || '')
      && form.platform === (props.editData.platform || 'qq')

    if (onlyNameChanged) {
      payload = {
        id: props.editData.id,
        name: form.name,
      }
    }
    else {
      payload = {
        id: props.editData.id,
        name: form.name,
        code,
        platform: form.platform,
        loginType: 'manual',
      }
    }
  }
  else {
    payload = {
      name: form.name,
      code,
      platform: form.platform,
      loginType: 'manual',
    }
  }

  await addAccount(payload)
}

function close() {
  stopQRCheck()
  emit('close')
}

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errorMessage.value = ''
      if (props.editData) {
        activeTab.value = 'qr'
        form.name = props.editData.name
        form.code = props.editData.code || ''
        form.platform = props.editData.platform || 'qq'
        loadQRCode()
      }
      else {
        activeTab.value = 'qr'
        form.name = ''
        form.code = ''
        form.platform = 'qq'
        loadQRCode()
      }
    }
    else {
      stopQRCheck()
      qrData.value = null
      qrStatus.value = ''
    }
  },
)
</script>

<template>
  <a-modal :open="show" :footer="null" :mask-closable="!loading" :width="420" destroy-on-hidden @cancel="close">
    <template #title>
      <div class="flex items-center gap-2">
        <div :class="editData ? 'i-twemoji-memo' : 'i-twemoji-plus'" class="text-lg" />
        <span>{{ editData ? '编辑账号' : '添加账号' }}</span>
      </div>
    </template>

    <!-- Error -->
    <div
      v-if="errorMessage"
      class="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-base opacity-90 a-color-white a-bg-error"
    >
      <div class="i-twemoji-warning shrink-0 text-base" />
      {{ errorMessage }}
    </div>

    <!-- Tab switcher -->
    <div class="mb-4 flex items-center gap-1 rounded-lg p-0.5 a-bg-fill-tertiary">
      <a-button
        type="text"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-base transition-all"
        :class="
          activeTab === 'qr'
            ? 'a-bg-container a-color-primary-text font-semibold shadow-sm a-bg-primary-bg hover:!a-bg-primary-bg hover:!a-color-primary-text'
            : 'a-color-text-secondary'
        "
        @click="((activeTab = 'qr'), loadQRCode())"
      >
        <div class="i-twemoji-camera-with-flash text-base" />
        {{ editData ? '扫码更新' : '扫码登录' }}
      </a-button>
      <a-button
        type="text"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-base transition-all"
        :class="
          activeTab === 'manual'
            ? 'a-bg-container a-color-primary-text font-semibold shadow-sm a-bg-primary-bg hover:!a-bg-primary-bg hover:!a-color-primary-text'
            : 'a-color-text-secondary'
        "
        @click="((activeTab = 'manual'), stopQRCheck())"
      >
        <div class="i-twemoji-keyboard text-base" />
        手动填码
      </a-button>
    </div>

    <!-- QR Tab -->
    <div v-if="activeTab === 'qr'" class="flex flex-col items-center gap-3">
      <div class="text-sm a-color-text-tertiary">
        使用手机QQ扫码，默认使用QQ昵称
      </div>

      <div
        class="relative overflow-hidden border-2 rounded-xl border-dashed p-2 transition-colors a-bg-container"
        :class="
          qrStatus === '登录成功!'
            ? 'a-border a-border-success a-bg-container'
            : 'a-border a-border-border a-bg-container'
        "
      >
        <div v-if="qrData && (qrData.image || qrData.qrcode)">
          <img
            :src="
              qrData.image
                ? qrData.image.startsWith('data:')
                  ? qrData.image
                  : `data:image/png;base64,${qrData.image}`
                : qrData.qrcode
            "
            class="h-52 w-52 rounded-lg"
          >
        </div>
        <div v-else class="h-52 w-52 flex flex-col items-center justify-center gap-2 rounded-lg a-bg-fill-tertiary">
          <a-spin v-if="loading" />
          <template v-else>
            <div class="i-twemoji-framed-picture text-3xl opacity-30" />
            <span class="text-sm a-color-text-tertiary">二维码区域</span>
          </template>
        </div>
        <div
          v-if="qrStatus === '登录成功!'"
          class="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[1px] a-bg-primary-bg"
        >
          <div class="flex flex-col items-center gap-1">
            <div class="i-twemoji-check-mark-button text-4xl" />
            <span class="text-base font-bold a-color-primary-text">登录成功</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-base a-color-text-secondary">
        <div v-if="qrStatus === '等待扫码...'" class="h-1.5 w-1.5 animate-pulse rounded-full a-bg-info" />
        <div v-else-if="qrStatus.includes('失效')" class="i-twemoji-warning text-base" />
        {{ qrStatus }}
      </div>

      <div class="flex items-center gap-2">
        <a-button @click="loadQRCode">
          <template #icon>
            <div class="i-twemoji-counterclockwise-arrows-button text-base" />
          </template>
          刷新二维码
        </a-button>
        <a-button v-if="qrData?.url" class="md:hidden" @click="openQRCodeLoginUrl">
          <template #icon>
            <div class="i-twemoji-mobile-phone text-base" />
          </template>
          跳转QQ登录
        </a-button>
      </div>
    </div>

    <!-- Manual Tab -->
    <div v-else>
      <a-form layout="vertical">
        <a-form-item label="备注名称">
          <a-input v-model:value="form.name" placeholder="留空默认使用昵称">
            <template #prefix>
              <div class="i-twemoji-label text-base" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="Code">
          <a-textarea v-model:value="form.code" :rows="3" placeholder="请输入登录 Code 或包含 code 的链接" />
        </a-form-item>

        <a-form-item v-if="!editData" label="平台">
          <a-select
            v-model:value="form.platform"
            :options="[
              { label: 'QQ小程序', value: 'qq' },
              { label: '微信小程序', value: 'wx' },
            ]"
          />
        </a-form-item>
      </a-form>

      <div class="flex items-center justify-end gap-2 border-t border-t-solid pt-3 a-border-t-border-sec">
        <a-button @click="close">
          取消
        </a-button>
        <a-button type="primary" :loading="loading" @click="submitManual">
          <template v-if="!loading" #icon>
            <div class="i-twemoji-check-mark-button text-base" />
          </template>
          {{ editData ? '保存' : '添加' }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>
