import { Controller, Get, Param, Post, Query, Logger } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  private readonly logger = new Logger(ShipmentsController.name);

  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  async findAll(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.shipmentsService.findAll(accountId);
  }

  @Get('stats')
  async getStats(@Query('accountId') accountId?: string) {
    return this.shipmentsService.getStats(accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Post('sync/:shipmentId')
  async syncShipment(
    @Param('shipmentId') shipmentId: string,
    @Query('accountId') accountId: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.shipmentsService.syncShipment(accountId, shipmentId);
  }

  @Post('backfill')
  async backfill(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.shipmentsService.backfillShipments(accountId);
  }
}
