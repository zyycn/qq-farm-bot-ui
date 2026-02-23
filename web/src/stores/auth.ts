import { useStorage } from '@vueuse/core'
import axios from 'axios'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage('admin_token', '')
  const router = useRouter()

  const isAuthenticated = () => !!token.value

  async function login(password: string) {
    try {
      const res = await axios.post('/api/login', { password })
      if (res.data.ok) {
        token.value = res.data.data.token
        return true
      }
      return false
    }
    catch (e) {
      console.error(e)
      return false
    }
  }

  function logout() {
    token.value = ''
    router.push('/login')
  }

  return { token, isAuthenticated, login, logout }
})
