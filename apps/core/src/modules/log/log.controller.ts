import { Controller, Get, Headers, Query } from '@nestjs/common'
import { RuntimeService } from '../runtime/runtime.service'

@Controller('logs')
export class LogController {
  constructor(private runtime: RuntimeService) {}

  @Get()
  getLogs(
    @Query('accountId') queryAccountId: string,
    @Query('limit') limit: string,
    @Query('tag') tag: string,
    @Query('module') module: string,
    @Query('event') event: string,
    @Query('keyword') keyword: string,
    @Query('isWarn') isWarn: string,
    @Query('timeFrom') timeFrom: string,
    @Query('timeTo') timeTo: string,
    @Headers('x-account-id') headerAccountId: string,
  ) {
    const rawAccountId = (queryAccountId || '').trim()
    let id: string
    if (!rawAccountId) {
      id = this.runtime.resolveAccountId(headerAccountId || '')
    } else if (rawAccountId === 'all') {
      id = ''
    } else {
      id = this.runtime.resolveAccountId(rawAccountId)
    }

    return this.runtime.getLogs(id, {
      limit: Math.max(1, Number(limit) || 100),
      tag: tag || '',
      module: module || '',
      event: event || '',
      keyword: keyword || '',
      isWarn,
      timeFrom: timeFrom || '',
      timeTo: timeTo || '',
    })
  }
}
