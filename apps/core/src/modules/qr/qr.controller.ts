import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator'
import { legacyRequire } from '../../config/paths'

@Controller('qr')
export class QrController {
  private get MiniProgramLoginSession() {
    return legacyRequire('services/qrlogin').MiniProgramLoginSession
  }

  @Public()
  @Post('create')
  async create() {
    return this.MiniProgramLoginSession.requestLoginCode()
  }

  @Public()
  @Post('check')
  async check(@Body('code') code: string) {
    if (!code) throw new BadRequestException('缺少 code')

    const result = await this.MiniProgramLoginSession.queryStatus(code)

    if (result.status === 'OK') {
      const ticket = result.ticket
      const uin = result.uin || ''
      const nickname = result.nickname || ''
      const appid = '1112386029'
      const authCode = await this.MiniProgramLoginSession.getAuthCode(ticket, appid)
      let avatar = ''
      if (uin) {
        avatar = `https://q1.qlogo.cn/g?b=qq&nk=${uin}&s=640`
      }
      return { status: 'OK', code: authCode, uin, avatar, nickname }
    } else if (result.status === 'Used') {
      return { status: 'Used' }
    } else if (result.status === 'Wait') {
      return { status: 'Wait' }
    } else {
      return { status: 'Error', error: result.msg }
    }
  }
}
