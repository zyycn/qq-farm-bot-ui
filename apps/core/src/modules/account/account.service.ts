import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DRIZZLE_TOKEN  } from '../../database/drizzle.provider'
import type {DrizzleDB} from '../../database/drizzle.provider';
import { RuntimeService } from '../runtime/runtime.service'

@Injectable()
export class AccountService {
  constructor(
    @Inject(DRIZZLE_TOKEN) private db: DrizzleDB,
    private runtime: RuntimeService,
  ) {}

  getAccounts() {
    return this.runtime.getAccounts()
  }

  createOrUpdateAccount(payload: any) {
    const provider = this.runtime.getDataProvider()
    if (!provider) throw new Error('运行时未就绪')

    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')

    const isUpdate = !!payload.id
    const resolvedUpdateId = isUpdate ? this.runtime.resolveAccountId(payload.id) : ''
    const body = isUpdate ? { ...payload, id: resolvedUpdateId || String(payload.id) } : payload

    let wasRunning = false
    if (isUpdate) {
      wasRunning = this.runtime.isAccountRunning(body.id)
    }

    // Check if only remark changed
    let onlyRemarkChanged = false
    if (isUpdate) {
      const oldAccounts = this.runtime.getAccounts()
      const oldAccount = oldAccounts.accounts.find((a: any) => a.id === body.id)
      if (oldAccount) {
        const payloadKeys = Object.keys(body)
        onlyRemarkChanged = payloadKeys.length === 2 && payloadKeys.includes('id') && payloadKeys.includes('name')
      }
    }

    const data = store.addOrUpdateAccount(body)

    this.runtime.addAccountLog(
      isUpdate ? 'update' : 'add',
      isUpdate ? `更新账号: ${body.name || body.id}` : `添加账号: ${body.name || body.id}`,
      isUpdate ? String(body.id) : String((data.accounts[data.accounts.length - 1] || {}).id || ''),
      body.name || '',
    )

    if (!isUpdate) {
      const newAcc = data.accounts[data.accounts.length - 1]
      if (newAcc) this.runtime.startAccount(newAcc.id)
    } else if (wasRunning && !onlyRemarkChanged) {
      this.runtime.restartAccount(body.id)
    }

    return data
  }

  deleteAccount(id: string) {
    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')

    const resolvedId = this.runtime.resolveAccountId(id) || String(id)
    const before = this.runtime.getAccounts()
    const target = (before.accounts || []).find((a: any) =>
      String(a.id) === resolvedId || String(a.uin) === id || String(a.qq) === id,
    )

    this.runtime.stopAccount(resolvedId)
    const data = store.deleteAccount(resolvedId)

    this.runtime.addAccountLog(
      'delete',
      `删除账号: ${(target && target.name) || id}`,
      resolvedId,
      target ? target.name : '',
    )

    return data
  }

  startAccount(id: string) {
    const resolvedId = this.runtime.resolveAccountId(id)
    const ok = this.runtime.startAccount(resolvedId)
    if (!ok) throw new NotFoundException('账号未找到')
    return null
  }

  stopAccount(id: string) {
    const resolvedId = this.runtime.resolveAccountId(id)
    const ok = this.runtime.stopAccount(resolvedId)
    if (!ok) throw new NotFoundException('账号未找到')
    return null
  }

  updateRemark(body: any) {
    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')

    const rawRef = body.id || body.accountId || body.uin
    const accounts = this.runtime.getAccounts().accounts || []
    const target = accounts.find((a: any) =>
      String(a.id) === String(rawRef) || String(a.uin) === String(rawRef) || String(a.qq) === String(rawRef),
    )

    if (!target?.id) throw new NotFoundException('账号未找到')

    const remark = String(body.remark ?? body.name ?? '').trim()
    if (!remark) throw new NotFoundException('缺少备注')

    const data = store.addOrUpdateAccount({ id: String(target.id), name: remark })
    this.runtime.setRuntimeAccountName(String(target.id), remark)
    this.runtime.addAccountLog('update', `更新账号备注: ${remark}`, String(target.id), remark)

    return data
  }

  getAccountLogs(limit: number) {
    return this.runtime.getAccountLogs(limit)
  }
}
