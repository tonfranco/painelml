import { Controller, Get, Post, Param, Query, Body, Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async findAll(
    @Query('accountId') accountId: string,
    @Query('packId') packId?: string,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.messagesService.findAll(accountId, { packId, orderId, status });
  }

  @Get('conversations')
  async findConversations(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.messagesService.findConversations(accountId);
  }

  @Get('stats')
  async getStats(@Query('accountId') accountId?: string) {
    return this.messagesService.getStats(accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Post('sync')
  async sync(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.messagesService.syncMessages(accountId);
  }

  @Post('send')
  async sendMessage(
    @Query('accountId') accountId: string,
    @Body('packId') packId: string,
    @Body('text') text: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    if (!packId || !text) {
      return { error: 'packId and text are required' };
    }
    return this.messagesService.sendMessage(accountId, packId, text);
  }

  @Post('mark-read')
  async markAsRead(
    @Query('accountId') accountId: string,
    @Body('messageIds') messageIds: string[],
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    if (!messageIds || messageIds.length === 0) {
      return { error: 'messageIds are required' };
    }
    return this.messagesService.markAsRead(accountId, messageIds);
  }

  @Post('seed-test-data')
  async seedTestData(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }
    return this.messagesService.seedTestData(accountId);
  }
}
