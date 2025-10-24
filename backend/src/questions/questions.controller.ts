import { Controller, Get, Post, Param, Query, Body, Logger } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name);

  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(
    @Query('accountId') accountId: string,
    @Query('status') status?: string,
    @Query('itemId') itemId?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.questionsService.findAll(accountId, { status, itemId });
  }

  @Get('stats')
  async getStats(@Query('accountId') accountId?: string) {
    return this.questionsService.getStats(accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post('sync/:questionId')
  async syncQuestion(
    @Param('questionId') questionId: string,
    @Query('accountId') accountId: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.questionsService.syncQuestion(accountId, questionId);
  }

  @Post('backfill')
  async backfill(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.questionsService.backfillQuestions(accountId);
  }

  @Post(':questionId/answer')
  async answer(
    @Param('questionId') questionId: string,
    @Query('accountId') accountId: string,
    @Body('answer') answer: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    if (!answer) {
      return { error: 'answer is required' };
    }
    return this.questionsService.answerQuestion(accountId, questionId, answer);
  }
}
