import { BadRequestException, Controller, Get } from '@nestjs/common'
import { AccountId } from '../../common/decorators/account-id.decorator'
import { legacyRequire } from '../../config/paths'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('status')
export class StatusController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  getStatus(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')

    const data = this.runtime.getStatus(id)

    if (data?.status) {
      const { level, exp } = data.status
      try {
        const { getLevelExpProgress } = legacyRequire('config/gameConfig')
        data.levelProgress = getLevelExpProgress(level, exp)
      } catch {
        // gameConfig not loaded
      }
    }

    return data
  }
}
