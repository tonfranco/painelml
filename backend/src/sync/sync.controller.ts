import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { SyncScope } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post(':accountId/start')
  start(
    @Param('accountId') accountId: string,
    @Query('scope') scope: SyncScope = 'all',
    @Query('days') daysRaw?: string,
  ) {
    const days = Math.max(1, Math.min(90, Number(daysRaw ?? 30) || 30));
    this.sync.start(accountId, scope, days);
    return { status: 'started', accountId, scope, days };
  }

  @Get(':accountId/status')
  status(@Param('accountId') accountId: string) {
    const st = this.sync.getStatus(accountId) ?? {
      running: false,
      startedAt: null,
      finishedAt: null,
      itemsProcessed: 0,
      ordersProcessed: 0,
      errors: [],
    };
    return st;
  }
}
