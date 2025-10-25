import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SqsService } from '../queue/sqs.service';
import { ItemsService } from '../items/items.service';
import { OrdersService } from '../orders/orders.service';
import { ShipmentsService } from '../shipments/shipments.service';
import { QuestionsService } from '../questions/questions.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookWorkerService {
  private readonly logger = new Logger(WebhookWorkerService.name);
  private isProcessing = false;

  constructor(
    private sqsService: SqsService,
    private itemsService: ItemsService,
    private ordersService: OrdersService,
    private shipmentsService: ShipmentsService,
    private questionsService: QuestionsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Processa mensagens da fila a cada 30 segundos
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue() {
    if (this.isProcessing) {
      this.logger.debug('Already processing queue, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      const messages = await this.sqsService.receiveMessages(10);

      if (messages.length === 0) {
        this.logger.debug('No messages in queue');
        return;
      }

      this.logger.log(`Processing ${messages.length} messages from queue`);

      for (const message of messages) {
        try {
          await this.processMessage(message);
          
          // Deleta mensagem após processamento bem-sucedido
          if (message.receiptHandle) {
            await this.sqsService.deleteMessage(message.receiptHandle);
          }
        } catch (error) {
          this.logger.error(`Error processing message ${message.id}:`, error);
          // Mensagem não é deletada e voltará para a fila após visibility timeout
        }
      }
    } catch (error) {
      this.logger.error('Error in queue processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa uma mensagem individual
   */
  private async processMessage(message: any) {
    this.logger.log(`Processing message: ${message.type} - ${message.id}`);

    switch (message.type) {
      case 'webhook':
        await this.processWebhook(message.payload);
        break;

      case 'sync_item':
        await this.processSyncItem(message.payload);
        break;

      case 'sync_order':
        await this.processSyncOrder(message.payload);
        break;

      case 'sync_shipment':
        await this.processSyncShipment(message.payload);
        break;

      case 'sync_question':
        await this.processSyncQuestion(message.payload);
        break;

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Processa um webhook
   */
  private async processWebhook(payload: any) {
    const { eventId, topic, resource, userId } = payload;

    this.logger.log(`Processing webhook: ${topic} - ${eventId}`);

    // Extrai o ID do recurso da URL
    const resourceId = this.extractResourceId(resource);

    if (!resourceId) {
      this.logger.error(`Could not extract resource ID from: ${resource}`);
      return;
    }

    // Busca a conta pelo userId (sellerId)
    const account = await this.prisma.account.findUnique({
      where: { sellerId: userId },
    });

    if (!account) {
      this.logger.error(`Account not found for userId: ${userId}`);
      return;
    }

    // Processa baseado no tópico
    switch (topic) {
      case 'items':
        await this.itemsService.syncItem(account.id, resourceId);
        break;

      case 'orders':
        await this.ordersService.syncOrder(account.id, resourceId);
        break;

      case 'shipments':
        await this.shipmentsService.syncShipment(account.id, resourceId);
        break;

      case 'questions':
        await this.questionsService.syncQuestion(account.id, resourceId);
        break;

      default:
        this.logger.warn(`Unhandled webhook topic: ${topic}`);
    }

    // Marca webhook como processado
    await this.prisma.webhookEvent.updateMany({
      where: { eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Processa sincronização de item
   */
  private async processSyncItem(payload: { accountId: string; resourceId: string }) {
    await this.itemsService.syncItem(payload.accountId, payload.resourceId);
  }

  /**
   * Processa sincronização de pedido
   */
  private async processSyncOrder(payload: { accountId: string; resourceId: string }) {
    await this.ordersService.syncOrder(payload.accountId, payload.resourceId);
  }

  /**
   * Processa sincronização de shipment
   */
  private async processSyncShipment(payload: { accountId: string; resourceId: string }) {
    await this.shipmentsService.syncShipment(payload.accountId, payload.resourceId);
  }

  /**
   * Processa sincronização de pergunta
   */
  private async processSyncQuestion(payload: { accountId: string; resourceId: string }) {
    await this.questionsService.syncQuestion(payload.accountId, payload.resourceId);
  }

  /**
   * Extrai o ID do recurso da URL
   */
  private extractResourceId(resource: string): string | null {
    const match = resource.match(/\/([^\/]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Processa webhooks pendentes do banco (fallback)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingWebhooks() {
    try {
      this.logger.log('Processing pending webhooks from database...');

      const pendingWebhooks = await this.prisma.webhookEvent.findMany({
        where: {
          processed: false,
          // attempts: { lt: 3 }, // Máximo 3 tentativas - TODO: adicionar campo ao schema
        },
        take: 20,
        orderBy: { receivedAt: 'asc' },
      });

      if (pendingWebhooks.length === 0) {
        this.logger.debug('No pending webhooks in database');
        return;
      }

      this.logger.log(`Found ${pendingWebhooks.length} pending webhooks`);

      for (const webhook of pendingWebhooks) {
        try {
          // Incrementa tentativas
          // await this.prisma.webhookEvent.update({
          //   where: { id: webhook.id },
          //   data: { attempts: { increment: 1 } },
          // });

          // Envia para a fila
          await this.sqsService.enqueueWebhook({
            eventId: webhook.eventId,
            topic: webhook.topic,
            resource: webhook.resource,
            userId: webhook.userId,
          });

          this.logger.log(`Webhook ${webhook.eventId} enqueued for processing`);
        } catch (error) {
          this.logger.error(`Error enqueuing webhook ${webhook.eventId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error processing pending webhooks:', error);
    }
  }
}
