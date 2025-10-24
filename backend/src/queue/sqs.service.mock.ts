import { Injectable, Logger } from '@nestjs/common';

/**
 * Mock do SQS Service para desenvolvimento sem LocalStack
 * 
 * Para usar:
 * 1. Renomeie sqs.service.ts para sqs.service.real.ts
 * 2. Renomeie este arquivo para sqs.service.ts
 * 3. Reinicie o backend
 */

export interface WebhookMessage {
  eventId: string;
  topic: string;
  resource: string;
  userId: string;
}

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private queue: WebhookMessage[] = [];

  async onModuleInit() {
    this.logger.warn('⚠️  SQS MOCK MODE - Usando fila em memória');
    this.logger.warn('⚠️  LocalStack não é necessário neste modo');
  }

  async sendMessage(message: WebhookMessage): Promise<void> {
    this.logger.log(`📨 Mensagem adicionada à fila em memória: ${message.eventId}`);
    this.queue.push(message);
  }

  async receiveMessages(maxMessages: number = 10): Promise<WebhookMessage[]> {
    const messages = this.queue.splice(0, maxMessages);
    
    if (messages.length > 0) {
      this.logger.log(`📥 Recebidas ${messages.length} mensagens da fila em memória`);
    }
    
    return messages;
  }

  async deleteMessage(eventId: string): Promise<void> {
    this.logger.log(`🗑️  Mensagem removida: ${eventId}`);
    // Não precisa fazer nada, já foi removida no receiveMessages
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
