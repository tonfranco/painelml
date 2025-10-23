import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { generateVerifier, generateChallenge } from './pkce';
import { PrismaService } from '../prisma/prisma.service';

const MEM_STATE: Map<string, { verifier: string; createdAt: number }> = new Map();
const MEM_TOKENS: Array<{ accountId: string; access_token: string; refresh_token: string; expires_in: number; scope?: string; token_type?: string; obtained_at: number }> = [];

@Injectable()
export class MeliService {
  private readonly logger = new Logger(MeliService.name);
  constructor(private readonly prisma: PrismaService) {}

  getConfig() {
    const base = process.env.APP_BASE_URL ?? 'http://localhost:4000';
    const redirectUri = process.env.MELI_REDIRECT_URI ?? `${base}/meli/oauth/callback`;
    const clientId = process.env.MELI_CLIENT_ID ?? '';
    const clientSecret = process.env.MELI_CLIENT_SECRET ?? '';
    return { base, redirectUri, clientId, clientSecret };
  }

  startAuth() {
    const { redirectUri, clientId } = this.getConfig();
    const state = randomUUID();
    const verifier = generateVerifier();
    const challenge = generateChallenge(verifier);

    MEM_STATE.set(state, { verifier, createdAt: Date.now() });

    const url = new URL('https://auth.mercadolibre.com/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    // PKCE parameters (se suportado)
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return { url: url.toString(), state };
  }

  async handleCallback(params: { code?: string; state?: string }, cookieState?: string) {
    const { code, state } = params;
    if (!code || !state) {
      throw new Error('invalid_oauth_callback');
    }
    let entry = MEM_STATE.get(state);
    // Fallback: if memory lost (e.g., restart), accept when signed cookie matches state
    if (!entry && cookieState && cookieState === state) {
      entry = { verifier: '', createdAt: Date.now() };
    }
    if (!entry) {
      throw new Error('invalid_state');
    }
    // Opcionalmente limpar estado após uso
    MEM_STATE.delete(state);

    const { redirectUri, clientId, clientSecret } = this.getConfig();

    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    // PKCE: Mercado Livre exige code_verifier quando usamos code_challenge
    if (entry.verifier && entry.verifier.length > 0) {
      body.set('code_verifier', entry.verifier);
    } else {
      // Não conseguimos recuperar o verifier (ex.: backend reiniciou antes do callback)
      this.logger.error('PKCE code_verifier ausente para o OAuth callback');
      throw new HttpException(
        {
          message: 'pkce_verifier_missing',
          hint: 'Refaça a conexão clicando novamente em "Conectar conta Mercado Livre" para reiniciar o fluxo OAuth.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
    let data: {
      access_token: string;
      token_type: string;
      expires_in: number;
      scope?: string;
      user_id?: number;
      refresh_token: string;
    };
    try {
      const resp = await axios.post(tokenUrl, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        validateStatus: () => true,
      });
      if (resp.status < 200 || resp.status >= 300) {
        this.logger.error(`Token exchange failed: status=${resp.status} data=${JSON.stringify(resp.data)}`);
        throw new HttpException(
          {
            message: 'mercadolibre_token_exchange_failed',
            status: resp.status,
            details: resp.data,
          },
          resp.status >= 500 ? HttpStatus.BAD_GATEWAY : HttpStatus.BAD_REQUEST,
        );
      }
      data = resp.data as any;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error(`Token exchange error`, err?.response?.data || err?.message || err);
      throw new HttpException(
        {
          message: 'mercadolibre_token_exchange_error',
          details: err?.response?.data || err?.message || 'unknown_error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    const sellerId = String(data.user_id ?? 'unknown');

    // Upsert Account by sellerId
    const account = await this.prisma.account.upsert({
      where: { sellerId },
      update: {},
      create: { sellerId },
    });

    // Persist token snapshot (history)
    await this.prisma.accountToken.create({
      data: {
        accountId: account.id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        scope: data.scope,
        expiresIn: data.expires_in,
        obtainedAt: new Date(),
      },
    });

    this.logger.log(`Obtained and stored token for seller ${sellerId}`);
    return { accountId: account.id, sellerId };
  }
}
