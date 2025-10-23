import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WebhookPayload {
  _id: string; // event_id único do ML
  resource: string; // URL do recurso
  user_id: string; // ID do seller
  topic: string; // orders, items, etc.
  application_id: string;
  attempts: number;
  sent: string; // ISO timestamp
  received: string; // ISO timestamp
}

/**
 * Serviço para processar webhooks do Mercado Livre com dedupe
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processa webhook com dedupe por event_id
   * Retorna true se foi processado, false se era duplicado
   */
  async processWebhook(payload: WebhookPayload): Promise<boolean> {
    const eventId = payload._id;

    this.logger.log(
      `📨 Webhook received: ${payload.topic} | event_id: ${eventId}`,
    );

    // Verifica se já foi processado (dedupe)
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      this.logger.warn(`⚠️  Duplicate webhook ignored: ${eventId}`);
      return false;
    }

    // Salva evento
    await this.prisma.webhookEvent.create({
      data: {
        eventId,
        topic: payload.topic,
        resource: payload.resource,
        userId: payload.user_id,
        attempts: payload.attempts,
        payload: JSON.stringify(payload),
      },
    });

    this.logger.log(`✅ Webhook saved: ${eventId} | topic: ${payload.topic}`);

    // Processar de acordo com o tópico
    await this.routeWebhook(payload);

    return true;
  }

  /**
   * Roteia webhook para processamento específico
   */
  private async routeWebhook(payload: WebhookPayload): Promise<void> {
    switch (payload.topic) {
      case 'orders_v2':
        await this.handleOrderWebhook(payload);
        break;
      case 'items':
        await this.handleItemWebhook(payload);
        break;
      case 'claims':
        this.logger.log(`📋 Claims webhook: ${payload.resource}`);
        break;
      case 'questions':
        this.logger.log(`❓ Questions webhook: ${payload.resource}`);
        break;
      default:
        this.logger.warn(`⚠️  Unknown topic: ${payload.topic}`);
    }
  }

  /**
   * Processa webhook de pedidos
   */
  private async handleOrderWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(`📦 Processing order webhook: ${payload.resource}`);

    // Extrai order_id da URL: /orders/123456789
    const orderId = payload.resource.split('/').pop();

    if (!orderId) {
      this.logger.error(`❌ Invalid order resource: ${payload.resource}`);
      return;
    }

    // Marca para sincronização (será processado pelo worker)
    await this.markEventProcessed(payload._id);

    this.logger.log(`✅ Order ${orderId} marked for sync`);
  }

  /**
   * Processa webhook de itens
   */
  private async handleItemWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(`🏷️  Processing item webhook: ${payload.resource}`);

    // Extrai item_id da URL: /items/MLB123456789
    const itemId = payload.resource.split('/').pop();

    if (!itemId) {
      this.logger.error(`❌ Invalid item resource: ${payload.resource}`);
      return;
    }

    // Marca para sincronização
    await this.markEventProcessed(payload._id);

    this.logger.log(`✅ Item ${itemId} marked for sync`);
  }

  /**
   * Marca evento como processado
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Lista eventos não processados para retry
   */
  async getPendingEvents(limit = 100) {
    return this.prisma.webhookEvent.findMany({
      where: { processed: false },
      orderBy: { receivedAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Estatísticas de webhooks
   */
  async getStats() {
    const [total, processed, pending, byTopic] = await Promise.all([
      this.prisma.webhookEvent.count(),
      this.prisma.webhookEvent.count({ where: { processed: true } }),
      this.prisma.webhookEvent.count({ where: { processed: false } }),
      this.prisma.webhookEvent.groupBy({
        by: ['topic'],
        _count: true,
      }),
    ]);

    return {
      total,
      processed,
      pending,
      byTopic: byTopic.map((t) => ({ topic: t.topic, count: t._count })),
    };
  }
}
