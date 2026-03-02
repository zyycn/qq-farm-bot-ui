import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common'
import { AccountId } from '../../common/decorators/account-id.decorator'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('settings')
export class SettingsController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  getSettings(@AccountId() accountId: string) {
    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')

    const id = this.runtime.resolveAccountId(accountId)
    return {
      intervals: store.getIntervals(id),
      strategy: store.getPlantingStrategy(id),
      preferredSeed: store.getPreferredSeed(id),
      friendQuietHours: store.getFriendQuietHours(id),
      stealCropBlacklist: store.getStealCropBlacklist(id),
      automation: store.getAutomation(id),
      ui: store.getUI(),
      offlineReminder: store.getOfflineReminder?.() || {
        channel: 'webhook',
        reloginUrlMode: 'none',
        endpoint: '',
        token: '',
        title: '账号下线提醒',
        msg: '账号下线',
        offlineDeleteSec: 120,
      },
    }
  }

  @Post('save')
  async saveSettings(@AccountId() accountId: string, @Body() body: any) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.saveSettings(id, body)
  }

  @Post('theme')
  async saveTheme(@Body('theme') theme: string) {
    return this.runtime.setUITheme(theme)
  }

  @Post('offline-reminder')
  saveOfflineReminder(@Body() body: any) {
    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')
    return store.setOfflineReminder?.(body) || {}
  }
}

@Controller('automation')
export class AutomationController {
  constructor(private runtime: RuntimeService) {}

  @Post()
  async setAutomation(@AccountId() accountId: string, @Body() body: Record<string, any>) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    let lastData: any = null
    for (const [k, v] of Object.entries(body)) {
      lastData = await this.runtime.setAutomation(id, k, v)
    }
    return lastData || {}
  }
}
