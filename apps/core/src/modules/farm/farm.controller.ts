import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common'
import { AccountId } from '../../common/decorators/account-id.decorator'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('farm')
export class FarmController {
  constructor(private runtime: RuntimeService) {}

  @Post('operate')
  async operate(@AccountId() accountId: string, @Body('opType') opType: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    await this.runtime.doFarmOp(id, opType)
    return null
  }
}

@Controller('lands')
export class LandsController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getLands(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getLands(id)
  }
}

@Controller('seeds')
export class SeedsController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getSeeds(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getSeeds(id)
  }
}

@Controller('bag')
export class BagController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getBag(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getBag(id)
  }
}

@Controller('daily-gifts')
export class DailyGiftsController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getDailyGifts(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getDailyGifts(id)
  }
}
