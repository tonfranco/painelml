import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SqsService } from '../queue/sqs.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly sqsService: SqsService,
  ) {}

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
        // attempts: payload.attempts, // TODO: adicionar campo ao schema
        payload: JSON.stringify(payload),
      },
    });

    this.logger.log(`✅ Webhook saved: ${eventId} | topic: ${payload.topic}`);

    // Processar de acordo com o tópico
    await this.routeWebhook(payload);

    return true;
  }

  /**
   * Roteia webhook para processamento assíncrono via SQS
   */
  private async routeWebhook(payload: WebhookPayload): Promise<void> {
    // Normaliza o tópico
    let topic = payload.topic;
    if (topic === 'orders_v2') {
      topic = 'orders';
    }

    // Envia para a fila SQS para processamento assíncrono
    try {
      await this.sqsService.enqueueWebhook({
        eventId: payload._id,
        topic,
        resource: payload.resource,
        userId: payload.user_id,
      });

      this.logger.log(
        `✅ Webhook enqueued for async processing: ${topic} | ${payload._id}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error enqueuing webhook: ${error.message}`);
      throw error;
    }
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
      byTopic: byTopic.map((t: any) => ({ topic: t.topic, count: t._count })),
    };
  }

  /**
   * Lista webhooks configurados (mock - em produção consultaria a API do ML)
   */
  async getSubscriptions() {
    // Em produção, consultaria: GET https://api.mercadolibre.com/applications/{app_id}/webhooks
    // Por enquanto, retorna os tópicos que estamos processando
    const topics = await this.prisma.webhookEvent.groupBy({
      by: ['topic'],
      _count: true,
      orderBy: { _count: { topic: 'desc' } },
    });

    return {
      subscriptions: topics.map((t: any) => ({
        topic: t.topic,
        eventsReceived: t._count,
        status: 'active',
      })),
    };
  }
}
