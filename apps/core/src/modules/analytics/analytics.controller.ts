import { Controller, Get, Query } from '@nestjs/common'
import { legacyRequire } from '../../config/paths'

@Controller('analytics')
export class AnalyticsController {
  @Get()
  getAnalytics(@Query('sort') sort?: string) {
    const { getPlantRankings } = legacyRequire('services/analytics')
    return getPlantRankings(sort || 'exp')
  }
}
