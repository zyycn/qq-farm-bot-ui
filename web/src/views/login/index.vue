<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'

const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)
const focused = ref(false)
const token = useStorage('admin_token', '')

async function handleLogin() {
  if (!password.value) {
    error.value = '请输入管理密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login(password.value)
    if (res.data.ok) {
      token.value = res.data.data.token
      router.push('/')
    }
    else {
      error.value = res.data.error || '登录失败'
    }
  }
  catch (e: any) {
    error.value = e.response?.data?.error || e.message || '登录异常'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative h-[100dvh] w-screen overflow-hidden">
    <!-- Sky -->
    <div class="absolute inset-0 z-0 from-sky-100 via-sky-200 to-sky-300 bg-gradient-to-b" />
    <!-- Grass -->
    <svg
      class="pointer-events-none absolute bottom-0 left-0 z-[1] h-[32%] w-full"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#d1fae5" stop-opacity="0.5" />
          <stop offset="0.6" stop-color="#a7f3d0" />
          <stop offset="1" stop-color="#86efac" />
        </linearGradient>
      </defs>
      <path d="M0 32V18Q25 8 50 18t50 0v14Z" fill="url(#grass)" />
    </svg>
    <!-- Clouds -->
    <div class="cloud cloud-1" />
    <div class="cloud cloud-2" />
    <div class="cloud cloud-3" />
    <!-- Decorations -->
    <div class="pointer-events-none absolute inset-0 z-10">
      <div class="absolute bottom-[36%] left-[6%] max-md:hidden">
        <span class="i-twemoji-evergreen-tree inline-block text-4xl opacity-90 drop-shadow md:text-5xl" />
      </div>
      <div class="absolute bottom-[34%] right-[10%] max-md:hidden">
        <span class="i-twemoji-deciduous-tree inline-block text-4xl opacity-85 drop-shadow md:text-5xl" />
      </div>
      <div class="absolute bottom-[32%] left-[22%] max-md:hidden">
        <span class="i-twemoji-house-with-garden inline-block text-4xl opacity-85 drop-shadow md:text-5xl" />
      </div>
      <div class="absolute bottom-[30%] right-[30%] max-md:hidden">
        <span class="i-twemoji-sunflower inline-block text-2xl opacity-90 drop-shadow md:text-3xl" />
      </div>
      <div class="absolute bottom-[28%] right-[6%] max-md:bottom-[33%] max-md:right-[4%]">
        <span class="i-twemoji-farmer animate-sway inline-block text-3xl opacity-95 drop-shadow md:text-4xl" />
      </div>
    </div>

    <!-- Card -->
    <div class="absolute inset-0 z-20 flex items-center justify-center p-5">
      <a-card
        variant="borderless"
        class="login-card max-w-[380px] w-full overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)]"
        :classes="{ body: '!p-0' }"
      >
        <!-- Brand -->
        <div class="from-green-50 flex flex-col items-center to-white bg-gradient-to-b px-6 pb-5 pt-8">
          <a-avatar :size="48" class="mb-3 bg-green-2">
            <template #icon>
              <span class="i-twemoji-seedling text-xl" />
            </template>
          </a-avatar>
          <h1 class="text-xl font-bold tracking-tight a-color-text">
            QQ农场智能助手
          </h1>
          <p class="mt-1 text-[13px] a-color-text-tertiary">
            输入管理密码以继续
          </p>
        </div>

        <!-- Form -->
        <div class="px-7 py-5 pb-7">
          <a-form layout="vertical" @submit.prevent="handleLogin">
            <a-form-item :validate-status="error ? 'error' : ''" :help="error || undefined">
              <a-input-password
                v-model:value="password"
                placeholder="管理密码"
                size="large"
                autocomplete="current-password"
                :disabled="loading"
                @focus="focused = true"
                @blur="focused = false"
              >
                <template #prefix>
                  <span
                    class="text-base transition-colors duration-200"
                    :class="focused ? 'i-twemoji-unlocked' : 'i-twemoji-locked'"
                  />
                </template>
              </a-input-password>
            </a-form-item>

            <a-button html-type="submit" type="primary" block size="large" :loading="loading" class="mt-1">
              <template v-if="!loading" #icon>
                <span class="i-twemoji-seedling" />
              </template>
              进入农场
            </a-button>
          </a-form>

          <div class="mt-4 flex select-none items-center justify-center gap-1.5 text-xs a-color-text-tertiary">
            <span class="i-twemoji-shield text-sm" />
            <span>数据经加密传输，仅管理员可访问</span>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
/* Clouds: pseudo-elements + keyframes (UnoCSS can't handle ::before/::after shapes) */
.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: drift linear infinite;
}
.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}
.cloud-1 {
  width: 80px;
  height: 28px;
  top: 12%;
  left: 12%;
  animation-duration: 45s;
}
.cloud-1::before {
  width: 34px;
  height: 34px;
  left: 14px;
  top: -14px;
}
.cloud-1::after {
  width: 44px;
  height: 24px;
  left: 34px;
  top: -7px;
}
.cloud-2 {
  width: 100px;
  height: 32px;
  top: 30%;
  right: 8%;
  left: auto;
  animation-duration: 55s;
  animation-direction: reverse;
}
.cloud-2::before {
  width: 40px;
  height: 40px;
  left: 20px;
  top: -16px;
}
.cloud-2::after {
  width: 50px;
  height: 28px;
  left: 48px;
  top: -9px;
}
.cloud-3 {
  width: 65px;
  height: 22px;
  top: 50%;
  left: 5%;
  animation-duration: 50s;
  animation-delay: -18s;
}
.cloud-3::before {
  width: 28px;
  height: 28px;
  left: 10px;
  top: -11px;
}
.cloud-3::after {
  width: 34px;
  height: 19px;
  left: 26px;
  top: -5px;
}

@keyframes drift {
  from {
    transform: translateX(-12vw);
  }
  to {
    transform: translateX(112vw);
  }
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}
.animate-sway {
  animation: sway 3s ease-in-out infinite;
}
</style>
