import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';

// Estrutura mínima de webhook do ML
// https://api.mercadolibre.com/platform-notifications
interface MeliWebhookBody {
  id: number | string;
  resource: string; // e.g., "/orders/123456789"
  topic: string; // e.g., "orders_v2", "items", "shipments", "questions"
  application_id?: number;
  attempts?: number;
  sent?: string;
  received?: string;
  user_id?: number;
}

const PROCESSED_IDS = new Set<string>();

@Controller('meli')
export class WebhooksController {
  @Post('webhooks')
  @HttpCode(200)
  async handle(@Body() body: MeliWebhookBody, @Headers('x-correlation-id') corr?: string) {
    const key = `${body.topic}:${body.resource}:${body.id}`;
    if (PROCESSED_IDS.has(key)) {
      return { status: 'duplicate', correlation_id: corr };
    }
    PROCESSED_IDS.add(key);
    // TODO: Enfileirar para processamento assíncrono (SQS) — fase posterior
    return { status: 'ok', topic: body.topic, resource: body.resource, correlation_id: corr };
  }
}
