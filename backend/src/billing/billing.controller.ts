import { Controller, Get, Post, Query, Param, Logger } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('sync')
  async syncBilling(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.billingService.syncBillingPeriods(accountId);
      return {
        success: true,
        message: `Synced ${result.synced} of ${result.total} periods`,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error syncing billing: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('periods')
  async getPeriods(
    @Query('accountId') accountId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.billingService.getBillingPeriods(accountId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        status,
      });
      return result;
    } catch (error) {
      this.logger.error(`Error fetching periods: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('periods/:periodId')
  async getPeriodDetails(@Param('periodId') periodId: string) {
    try {
      const result = await this.billingService.getBillingPeriodDetails(periodId);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching period details: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('stats')
  async getStats(
    @Query('accountId') accountId: string,
    @Query('months') months?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.billingService.getFinancialStats(
        accountId,
        months ? parseInt(months) : undefined,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error fetching stats: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('products/profitability')
  async getProductProfitability(
    @Query('accountId') accountId: string,
    @Query('months') months?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.billingService.getProductProfitability(
        accountId,
        months ? parseInt(months) : undefined,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error fetching product profitability: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('breakdown')
  async getCostBreakdown(
    @Query('accountId') accountId: string,
    @Query('months') months?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.billingService.getCostBreakdown(
        accountId,
        months ? parseInt(months) : undefined,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error fetching cost breakdown: ${error.message}`);
      return { error: error.message };
    }
  }
}
