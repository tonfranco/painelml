import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Mock do SQS Service para desenvolvimento sem LocalStack
 * Usa fila em memória ao invés de AWS SQS
 */

export interface QueueMessage {
  id: string;
  type: 'webhook' | 'sync_item' | 'sync_order' | 'sync_shipment' | 'sync_question';
  payload: any;
  receiptHandle?: string;
}

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly logger = new Logger(SqsService.name);
  private queue: QueueMessage[] = [];
  private messageCounter = 0;

  async onModuleInit() {
    this.logger.warn('⚠️  SQS MOCK MODE - Usando fila em memória');
    this.logger.warn('⚠️  LocalStack não é necessário neste modo');
  }

  /**
   * Envia uma mensagem para a fila
   */
  async sendMessage(message: Omit<QueueMessage, 'receiptHandle'>): Promise<string> {
    const messageId = `mock-${++this.messageCounter}`;
    const fullMessage: QueueMessage = {
      ...message,
      receiptHandle: `receipt-${messageId}`,
    };
    
    this.queue.push(fullMessage);
    this.logger.log(`📨 Mensagem adicionada à fila: ${message.id} (${message.type})`);
    
    return messageId;
  }

  /**
   * Recebe mensagens da fila
   */
  async receiveMessages(maxMessages: number = 10): Promise<QueueMessage[]> {
    const messages = this.queue.splice(0, maxMessages);
    
    if (messages.length > 0) {
      this.logger.log(`📥 Recebidas ${messages.length} mensagens da fila`);
    }
    
    return messages;
  }

  /**
   * Deleta uma mensagem da fila após processamento
   */
  async deleteMessage(receiptHandle: string): Promise<void> {
    this.logger.debug(`🗑️  Mensagem removida: ${receiptHandle}`);
    // Não precisa fazer nada, já foi removida no receiveMessages
  }

  /**
   * Envia webhook para processamento assíncrono
   */
  async enqueueWebhook(webhookData: {
    eventId: string;
    topic: string;
    resource: string;
    userId: string;
  }): Promise<string> {
    return this.sendMessage({
      id: webhookData.eventId,
      type: 'webhook',
      payload: webhookData,
    });
  }

  /**
   * Envia job de sincronização para a fila
   */
  async enqueueSyncJob(
    type: 'sync_item' | 'sync_order' | 'sync_shipment' | 'sync_question',
    data: { accountId: string; resourceId: string },
  ): Promise<string> {
    return this.sendMessage({
      id: `${type}-${data.resourceId}`,
      type,
      payload: data,
    });
  }

  /**
   * Retorna o tamanho atual da fila (útil para debug)
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}
