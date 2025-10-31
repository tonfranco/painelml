import { Controller, Get, Post, Put, Delete, Body, Query, Param, Logger } from '@nestjs/common';
import { TaxesService } from './taxes.service';

@Controller('taxes')
export class TaxesController {
  private readonly logger = new Logger(TaxesController.name);

  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  async create(
    @Query('accountId') accountId: string,
    @Body() data: {
      name: string;
      category: string;
      amount: number;
      description?: string;
      isRecurring?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const tax = await this.taxesService.create(accountId, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return tax;
    } catch (error) {
      this.logger.error(`Error creating tax: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get()
  async findAll(
    @Query('accountId') accountId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const taxes = await this.taxesService.findAll(
        accountId,
        includeInactive === 'true',
      );
      return taxes;
    } catch (error) {
      this.logger.error(`Error fetching taxes: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('summary')
  async getSummary(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const summary = await this.taxesService.getSummaryByCategory(accountId);
      const total = summary.reduce((sum: number, item: any) => sum + item.total, 0);
      return { summary, total };
    } catch (error) {
      this.logger.error(`Error fetching summary: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const tax = await this.taxesService.findOne(id);
      return tax;
    } catch (error) {
      this.logger.error(`Error fetching tax: ${error.message}`);
      return { error: error.message };
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      category?: string;
      amount?: number;
      description?: string;
      isRecurring?: boolean;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
    },
  ) {
    try {
      const tax = await this.taxesService.update(id, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return tax;
    } catch (error) {
      this.logger.error(`Error updating tax: ${error.message}`);
      return { error: error.message };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.taxesService.remove(id);
      return { success: true, message: 'Tax deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting tax: ${error.message}`);
      return { error: error.message };
    }
  }
}
