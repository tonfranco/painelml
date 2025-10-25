import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca ou cria configurações para uma conta
   */
  async getSettings(accountId: string) {
    let settings = await this.prisma.settings.findUnique({
      where: { accountId },
    });

    // Se não existir, cria com valores padrão
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { accountId },
      });
    }

    return settings;
  }

  /**
   * Atualiza configurações
   */
  async updateSettings(accountId: string, data: any) {
    // Remove campos que não devem ser atualizados
    const { id, accountId: _, createdAt, updatedAt, ...updateData } = data;

    return this.prisma.settings.upsert({
      where: { accountId },
      create: {
        accountId,
        ...updateData,
      },
      update: updateData,
    });
  }

  /**
   * Reseta configurações para valores padrão
   */
  async resetSettings(accountId: string) {
    return this.prisma.settings.upsert({
      where: { accountId },
      create: { accountId },
      update: {
        syncInterval: 30,
        syncItems: true,
        syncOrders: true,
        syncQuestions: true,
        syncHistoryDays: 30,
        notificationsEnabled: true,
        notifyNewQuestions: true,
        notifyNewOrders: true,
        notifyLowStock: true,
        notifyQuestionsSLA: true,
        theme: 'system',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      },
    });
  }
}
