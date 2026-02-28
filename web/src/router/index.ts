import NProgress from 'nprogress'
import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuard } from './auth'
import routes from './routes'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(() => {
  NProgress.start()
})

setupAuthGuard(router)

router.afterEach(() => {
  NProgress.done()
})

export default router
