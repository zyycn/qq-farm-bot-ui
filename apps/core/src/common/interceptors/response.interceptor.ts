import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp()
    const response = httpContext.getResponse()

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200
        return {
          code: statusCode,
          message: 'ok',
          data: data ?? null,
        }
      }),
    )
  }
}
