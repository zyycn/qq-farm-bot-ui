import { Controller, Get } from '@nestjs/common'
import { AccountId } from '../../common/decorators/account-id.decorator'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('scheduler')
export class SchedulerController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getScheduler(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    return this.runtime.getSchedulerStatus(id)
  }
}
