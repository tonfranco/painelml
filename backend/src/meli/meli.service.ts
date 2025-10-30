import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { generateVerifier, generateChallenge } from './pkce';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';

const MEM_STATE: Map<string, { verifier: string; createdAt: number }> = new Map();

@Injectable()
export class MeliService {
  private readonly logger = new Logger(MeliService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

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

    // Salva conta e tokens criptografados
    const accountId = await this.accountsService.saveAccountWithTokens(
      { sellerId },
      {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope || '',
        expiresIn: data.expires_in,
      },
    );

    this.logger.log(`✅ Obtained and stored encrypted token for seller ${sellerId} (accountId: ${accountId})`);
    return { sellerId, accountId };
  }

  /**
   * Busca um token válido para a conta
   */
  async getAccessToken(accountId: string): Promise<string> {
    const tokens = await this.accountsService.getDecryptedTokens(accountId);
    if (!tokens) {
      throw new HttpException('No tokens found for account', HttpStatus.UNAUTHORIZED);
    }
    return tokens.accessToken;
  }

  /**
   * Renova o access token usando o refresh token
   */
  async refreshAccessToken(accountId: string): Promise<string> {
    const tokens = await this.accountsService.getDecryptedTokens(accountId);
    if (!tokens || !tokens.refreshToken) {
      throw new HttpException('No refresh token found', HttpStatus.UNAUTHORIZED);
    }

    const { clientId, clientSecret } = this.getConfig();

    try {
      this.logger.log(`Refreshing access token for account ${accountId}`);
      
      const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refreshToken,
      });

      const data = response.data;

      // Atualizar tokens no banco
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      await this.accountsService.saveAccountWithTokens(
        { sellerId: account.sellerId },
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenType: data.token_type || 'Bearer',
          scope: data.scope || '',
          expiresIn: data.expires_in,
        },
      );

      this.logger.log(`✅ Token refreshed successfully for account ${accountId}`);
      return data.access_token;
    } catch (error: any) {
      this.logger.error(`Error refreshing token: ${error.message}`);
      throw new HttpException(
        'Failed to refresh access token. Please re-authenticate.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Faz uma requisição autenticada à API do Mercado Livre
   */
  async makeAuthenticatedRequest(accountId: string, url: string, options: any = {}) {
    let accessToken = await this.getAccessToken(accountId);

    try {
      const response = await axios({
        url,
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      // Se receber 401, tentar renovar o token e fazer a requisição novamente
      if (response.status === 401) {
        this.logger.warn(`Token expired for account ${accountId}, refreshing...`);
        
        try {
          accessToken = await this.refreshAccessToken(accountId);
          
          // Tentar novamente com o novo token
          const retryResponse = await axios({
            url,
            ...options,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              ...options.headers,
            },
            timeout: 15000,
            validateStatus: () => true,
          });

          if (retryResponse.status >= 400) {
            this.logger.error(
              `ML API error after token refresh: ${retryResponse.status} - ${JSON.stringify(retryResponse.data)}`,
            );
            throw new HttpException(
              `ML API error: ${retryResponse.status} - ${retryResponse.data.message || 'Unknown error'}`,
              retryResponse.status,
            );
          }

          return retryResponse.data;
        } catch (refreshError: any) {
          this.logger.error(`Failed to refresh token: ${refreshError.message}`);
          throw new HttpException(
            'Token expired. Please re-authenticate your Mercado Livre account.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      if (response.status >= 400) {
        const errorData = response.data;
        let errorMessage = 'Unknown error';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.cause && Array.isArray(errorData.cause)) {
          errorMessage = errorData.cause.map((c: any) => `${c.code || ''}: ${c.message || c}`).join('; ');
        }
        
        this.logger.error(
          `ML API error: ${response.status} - ${errorMessage} - Full response: ${JSON.stringify(errorData)}`,
        );
        
        throw new HttpException(
          `ML API error: ${response.status} - ${errorMessage}`,
          response.status,
        );
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error calling ML API: ${error.message}`);
      throw new HttpException(
        'Error calling Mercado Libre API',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Busca informações de um pedido
   */
  async getOrder(accountId: string, orderId: string) {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;
    return this.makeAuthenticatedRequest(accountId, url);
  }

  /**
   * Busca informações de um item/produto
   */
  async getItem(accountId: string, itemId: string) {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    return this.makeAuthenticatedRequest(accountId, url);
  }

  /**
   * Cria um novo item/anúncio
   */
  async createItem(accountId: string, itemData: any) {
    const url = `https://api.mercadolibre.com/items`;
    
    this.logger.log(`Creating item with data: ${JSON.stringify(itemData, null, 2)}`);
    
    try {
      const result = await this.makeAuthenticatedRequest(accountId, url, {
        method: 'POST',
        data: itemData,
      });
      
      this.logger.log(`Item created successfully: ${result.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to create item: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`API Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw error;
    }
  }

  /**
   * Atualiza um item/anúncio existente
   */
  async updateItem(accountId: string, itemId: string, itemData: any) {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    return this.makeAuthenticatedRequest(accountId, url, {
      method: 'PUT',
      data: itemData,
    });
  }

  /**
   * Atualiza estoque de um item
   */
  async updateStock(accountId: string, itemId: string, quantity: number) {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    return this.makeAuthenticatedRequest(accountId, url, {
      method: 'PUT',
      data: {
        available_quantity: quantity,
      },
    });
  }

  /**
   * Atualiza preço de um item
   */
  async updatePrice(accountId: string, itemId: string, price: number) {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    return this.makeAuthenticatedRequest(accountId, url, {
      method: 'PUT',
      data: {
        price: price,
      },
    });
  }

  /**
   * Busca informações de um shipment
   */
  async getShipment(accountId: string, shipmentId: string) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}`;
    return this.makeAuthenticatedRequest(accountId, url);
  }

  /**
   * Busca SLA (prazo de despacho) de um shipment
   */
  async getShipmentSLA(accountId: string, shipmentId: string) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}/sla`;
    try {
      return await this.makeAuthenticatedRequest(accountId, url);
    } catch (error) {
      this.logger.warn(`Could not fetch SLA for shipment ${shipmentId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca Lead Time (prazos de entrega) de um shipment
   */
  async getShipmentLeadTime(accountId: string, shipmentId: string) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}/lead_time`;
    try {
      return await this.makeAuthenticatedRequest(accountId, url);
    } catch (error) {
      this.logger.warn(`Could not fetch lead time for shipment ${shipmentId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca atrasos de um shipment
   */
  async getShipmentDelays(accountId: string, shipmentId: string) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}/delays`;
    try {
      return await this.makeAuthenticatedRequest(accountId, url);
    } catch (error) {
      this.logger.warn(`Could not fetch delays for shipment ${shipmentId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca uma pergunta específica
   */
  async getQuestion(accountId: string, questionId: string) {
    const url = `https://api.mercadolibre.com/questions/${questionId}`;
    return this.makeAuthenticatedRequest(accountId, url);
  }

  /**
   * Busca perguntas com paginação
   */
  async getQuestions(
    accountId: string,
    params: { offset?: number; limit?: number; status?: string } = {},
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    const url = new URL(
      `https://api.mercadolibre.com/questions/search?seller_id=${account.sellerId}`,
    );

    if (params.offset) url.searchParams.set('offset', params.offset.toString());
    if (params.limit) url.searchParams.set('limit', params.limit.toString());
    if (params.status) url.searchParams.set('status', params.status);

    return this.makeAuthenticatedRequest(accountId, url.toString());
  }

  /**
   * Responde uma pergunta
   */
  async answerQuestion(accountId: string, questionId: string, answer: string) {
    const url = `https://api.mercadolibre.com/answers`;
    return this.makeAuthenticatedRequest(accountId, url, {
      method: 'POST',
      data: {
        question_id: questionId,
        text: answer,
      },
    });
  }
}
