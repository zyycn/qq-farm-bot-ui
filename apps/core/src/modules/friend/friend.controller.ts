import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common'
import { AccountId } from '../../common/decorators/account-id.decorator'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('friends')
export class FriendsController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  async getFriends(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getFriends(id)
  }
}

@Controller('friend')
export class FriendController {
  constructor(private runtime: RuntimeService) {}

  @Get(':gid/lands')
  async getFriendLands(@AccountId() accountId: string, @Param('gid') gid: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.getFriendLands(id, gid)
  }

  @Post(':gid/op')
  async doFriendOp(
    @AccountId() accountId: string,
    @Param('gid') gid: string,
    @Body('opType') opType: string,
  ) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    return this.runtime.doFriendOp(id, gid, opType)
  }
}

@Controller('friend-blacklist')
export class FriendBlacklistController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  getBlacklist(@AccountId() accountId: string) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    const store = this.runtime.getEngine()?.store
    return store?.getFriendBlacklist?.(id) || []
  }

  @Post('toggle')
  toggleBlacklist(@AccountId() accountId: string, @Body('gid') gid: number) {
    const id = this.runtime.resolveAccountId(accountId)
    if (!id) throw new BadRequestException('缺少 x-account-id')
    if (!gid) throw new BadRequestException('缺少 gid')

    const store = this.runtime.getEngine()?.store
    if (!store) throw new Error('运行时未就绪')

    const current = store.getFriendBlacklist(id) || []
    let next: number[]
    if (current.includes(gid)) {
      next = current.filter((g: number) => g !== gid)
    } else {
      next = [...current, gid]
    }
    const saved = store.setFriendBlacklist(id, next)
    this.runtime.broadcastConfig(id)
    return saved
  }
}
