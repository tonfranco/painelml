import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const existing = req.headers['x-correlation-id'] as string | undefined;
    const id = existing && typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
    req.correlationId = id;
    res.setHeader('x-correlation-id', id);
    next();
  }
}
