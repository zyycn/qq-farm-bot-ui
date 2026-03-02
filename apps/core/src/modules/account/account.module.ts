import { Module } from '@nestjs/common'
import { AccountService } from './account.service'
import { AccountController, AccountLogsController, AccountRemarkController } from './account.controller'

@Module({
  controllers: [AccountController, AccountRemarkController, AccountLogsController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
