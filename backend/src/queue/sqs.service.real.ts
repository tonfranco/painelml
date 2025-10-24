import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  CreateQueueCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';

export interface QueueMessage {
  id: string;
  type: 'webhook' | 'sync_item' | 'sync_order' | 'sync_shipment' | 'sync_question';
  payload: any;
  receiptHandle?: string;
}

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly logger = new Logger(SqsService.name);
  private sqsClient: SQSClient;
  private queueUrl: string;
  private readonly queueName = 'painelml-webhooks';

  constructor() {
    const isLocal = process.env.AWS_ENDPOINT || process.env.NODE_ENV === 'development';

    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
      credentials: isLocal
        ? {
            accessKeyId: 'test',
            secretAccessKey: 'test',
          }
        : undefined,
    });

    this.logger.log(
      `SQS initialized ${isLocal ? 'with LocalStack' : 'with AWS'}`,
    );
  }

  async onModuleInit() {
    await this.ensureQueueExists();
  }

  /**
   * Garante que a fila existe, criando se necessário
   */
  private async ensureQueueExists() {
    try {
      // Tenta obter URL da fila
      const getUrlCommand = new GetQueueUrlCommand({
        QueueName: this.queueName,
      });

      const response = await this.sqsClient.send(getUrlCommand);
      this.queueUrl = response.QueueUrl!;
      this.logger.log(`Queue URL: ${this.queueUrl}`);
    } catch (error: any) {
      if (error.name === 'QueueDoesNotExist' || error.Code === 'AWS.SimpleQueueService.NonExistentQueue') {
        this.logger.log(`Queue ${this.queueName} does not exist, creating...`);
        await this.createQueue();
      } else {
        this.logger.error('Error getting queue URL:', error);
        throw error;
      }
    }
  }

  /**
   * Cria a fila SQS
   */
  private async createQueue() {
    try {
      const createCommand = new CreateQueueCommand({
        QueueName: this.queueName,
        Attributes: {
          VisibilityTimeout: '300', // 5 minutos
          MessageRetentionPeriod: '86400', // 1 dia
          ReceiveMessageWaitTimeSeconds: '20', // Long polling
        },
      });

      const response = await this.sqsClient.send(createCommand);
      this.queueUrl = response.QueueUrl!;
      this.logger.log(`Queue created: ${this.queueUrl}`);
    } catch (error) {
      this.logger.error('Error creating queue:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem para a fila
   */
  async sendMessage(message: Omit<QueueMessage, 'receiptHandle'>) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          type: {
            DataType: 'String',
            StringValue: message.type,
          },
        },
      });

      const response = await this.sqsClient.send(command);
      this.logger.log(`Message sent to queue: ${response.MessageId}`);
      return response.MessageId;
    } catch (error) {
      this.logger.error('Error sending message to queue:', error);
      throw error;
    }
  }

  /**
   * Recebe mensagens da fila
   */
  async receiveMessages(maxMessages = 10): Promise<QueueMessage[]> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 20, // Long polling
        MessageAttributeNames: ['All'],
      });

      const response = await this.sqsClient.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        return [];
      }

      return response.Messages.map((msg: any) => {
        const body = JSON.parse(msg.Body || '{}');
        return {
          ...body,
          receiptHandle: msg.ReceiptHandle,
        };
      });
    } catch (error) {
      this.logger.error('Error receiving messages from queue:', error);
      throw error;
    }
  }

  /**
   * Deleta uma mensagem da fila após processamento
   */
  async deleteMessage(receiptHandle: string) {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
      this.logger.debug('Message deleted from queue');
    } catch (error) {
      this.logger.error('Error deleting message from queue:', error);
      throw error;
    }
  }

  /**
   * Envia webhook para processamento assíncrono
   */
  async enqueueWebhook(webhookData: {
    eventId: string;
    topic: string;
    resource: string;
    userId: string;
  }) {
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
  ) {
    return this.sendMessage({
      id: `${type}-${data.resourceId}`,
      type,
      payload: data,
    });
  }
}
