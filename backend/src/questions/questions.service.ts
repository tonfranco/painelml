import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private prisma: PrismaService,
    private meliApi: MeliService,
  ) {}

  /**
   * Busca todas as perguntas de uma conta
   */
  async findAll(accountId: string, filters?: { status?: string; itemId?: string }) {
    const where: any = { accountId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.itemId) {
      where.itemId = filters.itemId;
    }

    const questions = await this.prisma.question.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
    });

    // Buscar informações dos items relacionados
    const itemIds = [...new Set(questions.map(q => q.itemId).filter(Boolean))];
    const items = await this.prisma.item.findMany({
      where: { meliItemId: { in: itemIds as string[] } },
      select: {
        meliItemId: true,
        title: true,
        permalink: true,
      },
    });

    const itemsMap = new Map(items.map(item => [item.meliItemId, item]));

    // Adicionar informações do item a cada pergunta
    return questions.map(question => ({
      ...question,
      item: question.itemId ? itemsMap.get(question.itemId) : null,
    }));
  }

  /**
   * Busca uma pergunta específica
   */
  async findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
    });
  }

  /**
   * Busca pergunta pelo ID do Mercado Livre
   */
  async findByMeliId(meliQuestionId: string) {
    return this.prisma.question.findUnique({
      where: { meliQuestionId },
    });
  }

  /**
   * Sincroniza uma pergunta específica do Mercado Livre
   */
  async syncQuestion(accountId: string, questionId: string) {
    try {
      this.logger.log(`Syncing question ${questionId} for account ${accountId}`);

      const questionData = await this.meliApi.getQuestion(accountId, questionId);

      const question = await this.prisma.question.upsert({
        where: { meliQuestionId: questionId },
        create: {
          accountId,
          meliQuestionId: questionId,
          itemId: questionData.item_id,
          text: questionData.text,
          status: questionData.status,
          answer: questionData.answer?.text || null,
          dateCreated: new Date(questionData.date_created),
          dateAnswered: questionData.answer?.date_created
            ? new Date(questionData.answer.date_created)
            : null,
          fromId: questionData.from.id.toString(),
        },
        update: {
          status: questionData.status,
          answer: questionData.answer?.text || null,
          dateAnswered: questionData.answer?.date_created
            ? new Date(questionData.answer.date_created)
            : null,
        },
      });

      this.logger.log(`Question ${questionId} synced successfully`);
      return question;
    } catch (error) {
      this.logger.error(`Error syncing question ${questionId}:`, error);
      throw error;
    }
  }

  /**
   * Faz backfill de todas as perguntas de uma conta
   */
  async backfillQuestions(accountId: string) {
    try {
      this.logger.log(`Starting questions backfill for account ${accountId}`);

      let offset = 0;
      const limit = 50;
      let hasMore = true;
      let syncedCount = 0;
      let errorCount = 0;

      while (hasMore) {
        try {
          const response = await this.meliApi.getQuestions(accountId, {
            offset,
            limit,
          });

          if (!response.questions || response.questions.length === 0) {
            hasMore = false;
            break;
          }

          for (const question of response.questions) {
            try {
              await this.syncQuestion(accountId, question.id.toString());
              syncedCount++;
            } catch (error) {
              this.logger.error(`Error syncing question ${question.id}:`, error);
              errorCount++;
            }
          }

          offset += limit;
          hasMore = response.questions.length === limit;

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          this.logger.error(`Error fetching questions at offset ${offset}:`, error);
          errorCount++;
          hasMore = false;
        }
      }

      this.logger.log(
        `Questions backfill completed: ${syncedCount} synced, ${errorCount} errors`,
      );

      return { syncedCount, errorCount };
    } catch (error) {
      this.logger.error('Error in questions backfill:', error);
      throw error;
    }
  }

  /**
   * Responde uma pergunta
   */
  async answerQuestion(accountId: string, questionId: string, answer: string) {
    try {
      this.logger.log(`Answering question ${questionId}`);

      await this.meliApi.answerQuestion(accountId, questionId, answer);

      // Atualiza no banco
      const question = await this.prisma.question.update({
        where: { meliQuestionId: questionId },
        data: {
          answer,
          status: 'ANSWERED',
          dateAnswered: new Date(),
        },
      });

      this.logger.log(`Question ${questionId} answered successfully`);
      return question;
    } catch (error) {
      this.logger.error(`Error answering question ${questionId}:`, error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de perguntas
   */
  async getStats(accountId?: string) {
    const where = accountId ? { accountId } : {};

    const [total, unanswered, answered] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.count({
        where: { ...where, status: 'UNANSWERED' },
      }),
      this.prisma.question.count({
        where: { ...where, status: 'ANSWERED' },
      }),
    ]);

    // Calcula SLA (perguntas não respondidas há mais de 24h)
    const slaThreshold = new Date();
    slaThreshold.setHours(slaThreshold.getHours() - 24);

    const overdueSLA = await this.prisma.question.count({
      where: {
        ...where,
        status: 'UNANSWERED',
        dateCreated: { lt: slaThreshold },
      },
    });

    return {
      total,
      unanswered,
      answered,
      overdueSLA,
    };
  }
}
