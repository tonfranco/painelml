import { Controller, Get, Put, Query, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async get(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.settingsService.getSettings(accountId);
  }

  @Put()
  async update(
    @Query('accountId') accountId: string,
    @Body() data: any,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.settingsService.updateSettings(accountId, data);
  }

  @Put('reset')
  async reset(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.settingsService.resetSettings(accountId);
  }
}
