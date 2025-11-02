import { Controller, Get, Post, Put, Delete, Body, Query, Param, Logger } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(private readonly expensesService: ExpensesService) {}

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
      const expense = await this.expensesService.create(accountId, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return expense;
    } catch (error) {
      this.logger.error(`Error creating expense: ${error.message}`);
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
      const expenses = await this.expensesService.findAll(
        accountId,
        includeInactive === 'true',
      );
      return expenses;
    } catch (error) {
      this.logger.error(`Error fetching expenses: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get('summary')
  async getSummary(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const expenses = await this.expensesService.findAll(accountId, false);
      const totalMonthly = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalExpenses = expenses.length;
      
      return { 
        totalMonthly, 
        totalExpenses,
        expenses 
      };
    } catch (error) {
      this.logger.error(`Error fetching summary: ${error.message}`);
      return { error: error.message };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const expense = await this.expensesService.findOne(id);
      return expense;
    } catch (error) {
      this.logger.error(`Error fetching expense: ${error.message}`);
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
      const expense = await this.expensesService.update(id, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
      return expense;
    } catch (error) {
      this.logger.error(`Error updating expense: ${error.message}`);
      return { error: error.message };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.expensesService.remove(id);
      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting expense: ${error.message}`);
      return { error: error.message };
    }
  }
}
