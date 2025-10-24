import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/crypto.service';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  expiresIn: number;
}

export interface AccountData {
  sellerId: string;
  nickname?: string;
  siteId?: string;
}

/**
 * Serviço para gerenciar contas e tokens do Mercado Livre
 */
@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'dev-key-change-in-prod';
    if (this.encryptionKey === 'dev-key-change-in-prod') {
      this.logger.warn(
        '⚠️  Using default encryption key. Set ENCRYPTION_KEY in production!',
      );
    }
  }

  /**
   * Salva ou atualiza conta e tokens criptografados
   */
  async saveAccountWithTokens(
    accountData: AccountData,
    tokenData: TokenData,
  ): Promise<void> {
    const { sellerId, nickname, siteId } = accountData;

    this.logger.log(`Saving account for seller: ${sellerId}`);

    // Criptografa tokens sensíveis
    const encryptedAccess = await this.crypto.encrypt(
      tokenData.accessToken,
      this.encryptionKey,
    );
    const encryptedRefresh = await this.crypto.encrypt(
      tokenData.refreshToken,
      this.encryptionKey,
    );

    // Upsert da conta
    const account = await this.prisma.account.upsert({
      where: { sellerId },
      create: {
        sellerId,
        nickname,
        siteId,
      },
      update: {
        nickname,
        siteId,
      },
    });

    // Remove tokens antigos e cria novo
    await this.prisma.accountToken.deleteMany({
      where: { accountId: account.id },
    });

    await this.prisma.accountToken.create({
      data: {
        accountId: account.id,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenType: tokenData.tokenType,
        scope: tokenData.scope,
        expiresIn: tokenData.expiresIn,
      },
    });

    this.logger.log(`✅ Account and tokens saved for seller: ${sellerId}`);
  }

  /**
   * Recupera tokens descriptografados para uma conta
   */
  async getTokensForSeller(sellerId: string): Promise<TokenData | null> {
    const account = await this.prisma.account.findUnique({
      where: { sellerId },
      include: {
        tokens: {
          orderBy: { obtainedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!account || account.tokens.length === 0) {
      return null;
    }

    const token = account.tokens[0];

    // Descriptografa tokens
    const accessToken = await this.crypto.decrypt(
      token.accessToken,
      this.encryptionKey,
    );
    const refreshToken = await this.crypto.decrypt(
      token.refreshToken,
      this.encryptionKey,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: token.tokenType || 'Bearer',
      scope: token.scope || '',
      expiresIn: token.expiresIn,
    };
  }

  /**
   * Lista todas as contas conectadas
   */
  async listAccounts() {
    return this.prisma.account.findMany({
      select: {
        id: true,
        sellerId: true,
        nickname: true,
        siteId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Recupera tokens descriptografados por accountId
   */
  async getDecryptedTokens(accountId: string): Promise<TokenData | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        tokens: {
          orderBy: { obtainedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!account || account.tokens.length === 0) {
      return null;
    }

    const token = account.tokens[0];

    // Descriptografa tokens
    const accessToken = await this.crypto.decrypt(
      token.accessToken,
      this.encryptionKey,
    );
    const refreshToken = await this.crypto.decrypt(
      token.refreshToken,
      this.encryptionKey,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: token.tokenType || 'Bearer',
      scope: token.scope || '',
      expiresIn: token.expiresIn,
    };
  }

  /**
   * Verifica se um token está próximo de expirar (< 1 hora)
   */
  async isTokenExpiringSoon(sellerId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { sellerId },
      include: {
        tokens: {
          orderBy: { obtainedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!account || account.tokens.length === 0) {
      return true;
    }

    const token = account.tokens[0];
    const obtainedAt = token.obtainedAt.getTime();
    const expiresAt = obtainedAt + token.expiresIn * 1000;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    return expiresAt - now < oneHour;
  }
}
