import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { eq, lte } from 'drizzle-orm'
import { DRIZZLE_TOKEN } from '../../database/drizzle.provider'
import type { DrizzleDB } from '../../database/drizzle.provider'
import { CORE_ROOT, legacyRequire, MAIN_ENTRY } from '../../config/paths'
import * as schema from '../../database/schema'

// Legacy engine is a plain JS module, typed as any
type RuntimeEngine = any

@Injectable()
export class RuntimeService implements OnModuleInit {
  private engine!: RuntimeEngine
  private onStatusSync: ((accountId: string, status: any) => void) | null = null
  private onLog: ((entry: any) => void) | null = null
  private onAccountLog: ((entry: any) => void) | null = null

  constructor(
    @Inject(DRIZZLE_TOKEN) private db: DrizzleDB,
  ) {}

  setRealtimeCallbacks(callbacks: {
    onStatusSync?: (accountId: string, status: any) => void
    onLog?: (entry: any) => void
    onAccountLog?: (entry: any) => void
  }) {
    if (callbacks.onStatusSync) this.onStatusSync = callbacks.onStatusSync
    if (callbacks.onLog) this.onLog = callbacks.onLog
    if (callbacks.onAccountLog) this.onAccountLog = callbacks.onAccountLog
  }

  async onModuleInit() {
    await this.migrateJsonData()
    await this.initEngine()
  }

  private async migrateJsonData() {
    const dataDir = path.join(CORE_ROOT, 'data')

    // Migrate accounts.json
    const accountsFile = path.join(dataDir, 'accounts.json')
    if (fs.existsSync(accountsFile)) {
      try {
        const raw = JSON.parse(fs.readFileSync(accountsFile, 'utf8'))
        const accs = Array.isArray(raw.accounts) ? raw.accounts : []
        for (const acc of accs) {
          if (!acc.id) continue
          const existing = await this.db.select().from(schema.accounts).where(eq(schema.accounts.id, String(acc.id))).get()
          if (!existing) {
            await this.db.insert(schema.accounts).values({
              id: String(acc.id),
              uin: acc.uin || '',
              qq: acc.qq || acc.uin || '',
              name: acc.name || '',
              nick: acc.nick || '',
              platform: acc.platform || 'qq',
              code: acc.code || '',
              avatar: acc.avatar || '',
              createdAt: acc.createdAt || Date.now(),
              updatedAt: acc.updatedAt || Date.now(),
            })
          }
        }
        fs.renameSync(accountsFile, `${accountsFile  }.migrated`)
      } catch {
        // migration error, skip
      }
    }

    // Migrate store.json
    const storeFile = path.join(dataDir, 'store.json')
    if (fs.existsSync(storeFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(storeFile, 'utf8'))

        if (data.adminPasswordHash) {
          await this.upsertGlobalConfig('adminPasswordHash', data.adminPasswordHash)
        }
        if (data.ui) {
          await this.upsertGlobalConfig('ui', data.ui)
        }
        if (data.offlineReminder) {
          await this.upsertGlobalConfig('offlineReminder', data.offlineReminder)
        }
        if (data.defaultAccountConfig) {
          await this.upsertGlobalConfig('defaultAccountConfig', data.defaultAccountConfig)
        }

        // Migrate per-account configs
        const cfgMap = data.accountConfigs || {}
        for (const [id, cfg] of Object.entries(cfgMap)) {
          if (!id) continue
          const c = cfg as any
          const existing = await this.db.select().from(schema.accountConfigs).where(eq(schema.accountConfigs.accountId, id)).get()
          if (!existing) {
            await this.db.insert(schema.accountConfigs).values({
              accountId: id,
              automation: c.automation || {},
              plantingStrategy: c.plantingStrategy || 'preferred',
              preferredSeedId: c.preferredSeedId || 0,
              intervals: c.intervals || {},
              friendQuietHours: c.friendQuietHours || {},
              friendBlacklist: c.friendBlacklist || [],
              stealCropBlacklist: c.stealCropBlacklist || [],
            })
          }
        }

        fs.renameSync(storeFile, `${storeFile  }.migrated`)
      } catch {
        // migration error, skip
      }
    }
  }

  private async upsertGlobalConfig(key: string, value: any) {
    await this.db
      .insert(schema.globalConfig)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.globalConfig.key, set: { value } })
  }

  private async initEngine() {
    // The legacy runtime engine still reads from store.js which uses JSON files.
    // We bridge it by making legacy store compatible with DB-backed data.
    // For the initial refactoring, we keep legacy runtime engine running as-is,
    // since worker code stays JS and uses IPC.
    const { createRuntimeEngine } = legacyRequire('runtime/runtime-engine')

    this.engine = createRuntimeEngine({
      processRef: process,
      mainEntryPath: MAIN_ENTRY,
      onStatusSync: (accountId: string, status: any) => {
        if (this.onStatusSync) this.onStatusSync(accountId, status)
      },
      onLog: (entry: any) => {
        this.persistLog(entry)
        if (this.onLog) this.onLog(entry)
      },
      onAccountLog: (entry: any) => {
        this.persistAccountLog(entry)
        if (this.onAccountLog) this.onAccountLog(entry)
      },
    })

    await this.engine.start({
      startAdminServer: false, // NestJS handles HTTP
      autoStartAccounts: true,
    })
  }

  private async persistLog(entry: any) {
    try {
      await this.db.insert(schema.logs).values({
        accountId: entry?.accountId || '',
        accountName: entry?.accountName || '',
        tag: entry?.tag || '',
        module: entry?.meta?.module || '',
        event: entry?.meta?.event || '',
        msg: entry?.msg || '',
        isWarn: !!entry?.isWarn,
        ts: entry?.ts || Date.now(),
        meta: entry?.meta || {},
      })
      // Trim logs to 5000
      const count = await this.db.select().from(schema.logs).all()
      if (count.length > 5000) {
        const oldest = count[0]
        if (oldest?.id) {
          await this.db.delete(schema.logs).where(lte(schema.logs.id, oldest.id))
        }
      }
    } catch {
      // ignore DB write errors
    }
  }

  private async persistAccountLog(entry: any) {
    try {
      await this.db.insert(schema.accountLogs).values({
        accountId: entry?.accountId || '',
        accountName: entry?.accountName || '',
        action: entry?.action || '',
        msg: entry?.msg || '',
        reason: entry?.reason || '',
        ts: Date.now(),
        extra: entry || {},
      })
    } catch {
      // ignore
    }
  }

  getDataProvider() {
    return this.engine?.dataProvider
  }

  getEngine() {
    return this.engine
  }

  // Account resolution
  resolveAccountId(rawRef: string): string {
    const provider = this.getDataProvider()
    if (provider?.resolveAccountId) {
      return provider.resolveAccountId(rawRef) || rawRef
    }
    return rawRef
  }

  // Status
  getStatus(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getStatus?.(accountId) || null
  }

  // Lands
  getLands(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getLands?.(accountId)
  }

  // Friends
  getFriends(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getFriends?.(accountId)
  }

  getFriendLands(accountId: string, gid: string) {
    const provider = this.getDataProvider()
    return provider?.getFriendLands?.(accountId, gid)
  }

  doFriendOp(accountId: string, gid: string, opType: string) {
    const provider = this.getDataProvider()
    return provider?.doFriendOp?.(accountId, gid, opType)
  }

  // Seeds
  getSeeds(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getSeeds?.(accountId)
  }

  // Bag
  getBag(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getBag?.(accountId)
  }

  // Daily gifts
  getDailyGifts(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getDailyGifts?.(accountId)
  }

  // Farm operations
  doFarmOp(accountId: string, opType: string) {
    const provider = this.getDataProvider()
    return provider?.doFarmOp?.(accountId, opType)
  }

  // Automation
  setAutomation(accountId: string, key: string, value: any) {
    const provider = this.getDataProvider()
    return provider?.setAutomation?.(accountId, key, value)
  }

  // Settings
  saveSettings(accountId: string, payload: any) {
    const provider = this.getDataProvider()
    return provider?.saveSettings?.(accountId, payload)
  }

  setUITheme(theme: string) {
    const provider = this.getDataProvider()
    return provider?.setUITheme?.(theme)
  }

  // Accounts
  getAccounts() {
    const provider = this.getDataProvider()
    return provider?.getAccounts?.() || { accounts: [], nextId: 1 }
  }

  startAccount(accountId: string): boolean {
    const provider = this.getDataProvider()
    return provider?.startAccount?.(accountId) || false
  }

  stopAccount(accountId: string): boolean {
    const provider = this.getDataProvider()
    return provider?.stopAccount?.(accountId) || false
  }

  restartAccount(accountId: string): boolean {
    const provider = this.getDataProvider()
    return provider?.restartAccount?.(accountId) || false
  }

  isAccountRunning(accountId: string): boolean {
    const provider = this.getDataProvider()
    return provider?.isAccountRunning?.(accountId) || false
  }

  addAccountLog(action: string, msg: string, accountId: string, accountName: string) {
    const provider = this.getDataProvider()
    provider?.addAccountLog?.(action, msg, accountId, accountName)
  }

  setRuntimeAccountName(accountId: string, name: string) {
    const provider = this.getDataProvider()
    provider?.setRuntimeAccountName?.(accountId, name)
  }

  broadcastConfig(accountId: string) {
    const provider = this.getDataProvider()
    provider?.broadcastConfig?.(accountId)
  }

  // Logs (from legacy in-memory)
  getLogs(accountId: string, options: any) {
    const provider = this.getDataProvider()
    return provider?.getLogs?.(accountId, options) || []
  }

  getAccountLogs(limit: number) {
    const provider = this.getDataProvider()
    return provider?.getAccountLogs?.(limit) || []
  }

  // Scheduler
  async getSchedulerStatus(accountId: string) {
    const provider = this.getDataProvider()
    return provider?.getSchedulerStatus?.(accountId)
  }
}
