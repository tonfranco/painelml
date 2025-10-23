import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

// Estrutura do webhook do ML
// https://api.mercadolibre.com/platform-notifications
interface MeliWebhookBody {
  _id: string; // event_id único
  resource: string; // e.g., "/orders/123456789"
  topic: string; // e.g., "orders_v2", "items", "shipments", "questions"
  application_id: string;
  attempts: number;
  sent: string;
  received: string;
  user_id: string;
}

@Controller('meli')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('webhooks')
  @HttpCode(200)
  async handle(
    @Body() body: MeliWebhookBody,
    @Headers('x-correlation-id') corr?: string,
  ) {
    this.logger.log(
      `📨 Webhook received: ${body.topic} | correlation: ${corr}`,
    );

    try {
      const processed = await this.webhooksService.processWebhook(body);

      return {
        status: processed ? 'ok' : 'duplicate',
        topic: body.topic,
        resource: body.resource,
        correlation_id: corr,
      };
    } catch (error) {
      this.logger.error(`❌ Webhook processing error: ${error.message}`);
      // Retorna 200 mesmo com erro para evitar retry do ML
      return { status: 'error', error: error.message, correlation_id: corr };
    }
  }

  @Get('webhooks/stats')
  async getStats() {
    return this.webhooksService.getStats();
  }

  @Get('webhooks/pending')
  async getPending() {
    return this.webhooksService.getPendingEvents(50);
  }
}
