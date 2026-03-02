import path from 'node:path'
import fs from 'node:fs'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { AccountModule } from './modules/account/account.module'
import { FarmModule } from './modules/farm/farm.module'
import { FriendModule } from './modules/friend/friend.module'
import { SettingsModule } from './modules/settings/settings.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { LogModule } from './modules/log/log.module'
import { QrModule } from './modules/qr/qr.module'
import { SchedulerModule } from './modules/scheduler/scheduler.module'
import { RealtimeModule } from './modules/websocket/realtime.module'
import { RuntimeModule } from './modules/runtime/runtime.module'
import { StatusModule } from './modules/status/status.module'
import appConfig from './config/app.config'
import { LEGACY_DIR, resolveWebDist } from './config/paths'

function resolveGameConfig(): string {
  const dir = path.join(LEGACY_DIR, 'gameConfig')
  return fs.existsSync(dir) ? dir : ''
}

const webDist = resolveWebDist()
const gameConfigDir = resolveGameConfig()

const webStaticOptions = {
  fallthrough: true,
  etag: true,
  lastModified: true,
  setHeaders: (res: any, filePath: string) => {
    if (filePath.endsWith('index.html'))
      res.setHeader('Cache-Control', 'no-cache')
    else if (filePath.includes('/assets/'))
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
  },
}

const serveStaticModules = [
  ...(gameConfigDir ? [ServeStaticModule.forRoot({
    rootPath: gameConfigDir,
    serveRoot: '/game-config',
    serveStaticOptions: { fallthrough: true },
  })] : []),
  ...(webDist ? [ServeStaticModule.forRoot({ rootPath: webDist, serveStaticOptions: webStaticOptions })] : []),
]

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ...serveStaticModules,
    DatabaseModule,
    AuthModule,
    AccountModule,
    FarmModule,
    FriendModule,
    SettingsModule,
    AnalyticsModule,
    LogModule,
    QrModule,
    SchedulerModule,
    RealtimeModule,
    RuntimeModule,
    StatusModule,
  ],
})
export class AppModule {}
