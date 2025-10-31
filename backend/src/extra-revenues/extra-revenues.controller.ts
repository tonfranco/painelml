import { Controller, Get, Post, Put, Delete, Body, Query, Param, Logger } from '@nestjs/common';
import { ExtraRevenuesService } from './extra-revenues.service';

@Controller('extra-revenues')
export class ExtraRevenuesController {
  private readonly logger = new Logger(ExtraRevenuesController.name);

  constructor(private readonly extraRevenuesService: ExtraRevenuesService) {}

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
      const revenue = await this.extraRevenuesService.create(accountId, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return revenue;
    } catch (error) {
      this.logger.error(`Error creating extra revenue: ${error.message}`);
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
      const revenues = await this.extraRevenuesService.findAll(
        accountId,
        includeInactive === 'true',
      );
      return revenues;
    } catch (error) {
      this.logger.error(`Error fetching extra revenues: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('summary')
  async getSummary(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const summary = await this.extraRevenuesService.getSummaryByCategory(accountId);
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
      const revenue = await this.extraRevenuesService.findOne(id);
      return revenue;
    } catch (error) {
      this.logger.error(`Error fetching extra revenue: ${error.message}`);
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
      const revenue = await this.extraRevenuesService.update(id, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return revenue;
    } catch (error) {
      this.logger.error(`Error updating extra revenue: ${error.message}`);
      return { error: error.message };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.extraRevenuesService.remove(id);
      return { success: true, message: 'Extra revenue deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting extra revenue: ${error.message}`);
      return { error: error.message };
    }
  }
}
