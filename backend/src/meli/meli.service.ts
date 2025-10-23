import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { generateVerifier, generateChallenge } from './pkce';

const MEM_STATE: Map<string, { verifier: string; createdAt: number }> = new Map();
const MEM_TOKENS: Array<{ accountId: string; access_token: string; refresh_token: string; expires_in: number; scope?: string; token_type?: string; obtained_at: number }> = [];

@Injectable()
export class MeliService {
  private readonly logger = new Logger(MeliService.name);

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

  async handleCallback(params: { code?: string; state?: string }) {
    const { code, state } = params;
    if (!code || !state) {
      throw new Error('invalid_oauth_callback');
    }
    const entry = MEM_STATE.get(state);
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
    // Se ML suportar PKCE no futuro, incluir: code_verifier
    // body.set('code_verifier', entry.verifier);

    const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
    const resp = await axios.post(tokenUrl, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    const data = resp.data as {
      access_token: string;
      token_type: string;
      expires_in: number;
      scope?: string;
      user_id?: number;
      refresh_token: string;
    };

    const accountId = String(data.user_id ?? 'unknown');
    MEM_TOKENS.push({
      accountId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      token_type: data.token_type,
      obtained_at: Date.now(),
    });

    this.logger.log(`Obtained token for account ${accountId}`);
    return { accountId };
  }
}
