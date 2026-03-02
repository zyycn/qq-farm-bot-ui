import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { AccountService } from './account.service'

@Controller('accounts')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get()
  getAccounts() {
    return this.accountService.getAccounts()
  }

  @Post()
  createOrUpdate(@Body() body: any) {
    return this.accountService.createOrUpdateAccount(body)
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.accountService.deleteAccount(id)
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.accountService.startAccount(id)
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    return this.accountService.stopAccount(id)
  }
}

@Controller('account')
export class AccountRemarkController {
  constructor(private accountService: AccountService) {}

  @Post('remark')
  updateRemark(@Body() body: any) {
    return this.accountService.updateRemark(body)
  }
}

@Controller('account-logs')
export class AccountLogsController {
  constructor(private accountService: AccountService) {}

  @Get()
  getLogs(@Query('limit') limit?: string) {
    const n = Math.max(1, Number(limit) || 100)
    return this.accountService.getAccountLogs(n)
  }
}
