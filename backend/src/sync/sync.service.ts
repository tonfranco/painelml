import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import axios from 'axios';

export type SyncScope = 'items' | 'orders' | 'shipments' | 'questions' | 'all';

type Status = {
  running: boolean;
  startedAt: number;
  finishedAt?: number;
  itemsProcessed: number;
  ordersProcessed: number;
  shipmentsProcessed: number;
  questionsProcessed: number;
  errors: string[];
};

const STATUS: Map<string, Status> = new Map();

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  getStatus(accountId: string): Status | undefined {
    return STATUS.get(accountId);
  }

  async start(accountId: string, scope: SyncScope, days: number) {
    if (STATUS.get(accountId)?.running) return;
    STATUS.set(accountId, {
      running: true,
      startedAt: Date.now(),
      itemsProcessed: 0,
      ordersProcessed: 0,
      shipmentsProcessed: 0,
      questionsProcessed: 0,
      errors: [],
    });

    // fire-and-forget async work
    this.run(accountId, scope, days).catch((e) => {
      const st = STATUS.get(accountId);
      if (st) st.errors.push(e?.message || String(e));
      this.logger.error(`Sync failed`, e);
      STATUS.set(accountId, { ...(st as Status), running: false, finishedAt: Date.now() });
    });
  }

  private async run(accountId: string, scope: SyncScope, days: number) {
    const st = STATUS.get(accountId)!;
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('account_not_found');

    // Busca tokens descriptografados
    const tokens = await this.accountsService.getTokensForSeller(account.sellerId);
    if (!tokens) throw new Error('token_not_found');

    const authCtx = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    if (scope === 'items' || scope === 'all') {
      await this.syncItems(account.sellerId, account.id, authCtx, st);
    }
    if (scope === 'orders' || scope === 'all') {
      await this.syncOrders(account.sellerId, account.id, authCtx, days, st);
    }
    if (scope === 'shipments' || scope === 'all') {
      await this.syncShipments(account.id, authCtx, st);
    }
    if (scope === 'questions' || scope === 'all') {
      await this.syncQuestions(account.sellerId, account.id, authCtx, st);
    }

    STATUS.set(accountId, { ...st, running: false, finishedAt: Date.now() });
  }

  private async syncItems(sellerId: string, accountId: string, authCtx: { accessToken: string; refreshToken: string }, st: Status) {
    // Fetch item IDs by seller, then hydrate minimal fields per item id
    let offset = 0;
    const limit = 50;
    for (let page = 0; page < 5; page++) { // cap 250 results for MVP
      const searchUrl = `https://api.mercadolibre.com/users/${sellerId}/items/search?limit=${limit}&offset=${offset}`;
      const resp = await this.authedGet(searchUrl, accountId, authCtx, 15000);
      const ids: string[] = resp.data?.results || [];
      if (!ids.length) break;

      // Batch fetch details
      for (const id of ids) {
        try {
          const itemUrl = `https://api.mercadolibre.com/items/${id}`;
          const r = await this.authedGet(itemUrl, accountId, authCtx, 15000);
          const it = r.data;
          await this.prisma.item.upsert({
            where: { meliItemId: id },
            create: {
              accountId,
              meliItemId: id,
              title: it.title ?? '',
              status: it.status ?? 'unknown',
              price: Number(it.price ?? 0),
              available: Number(it.available_quantity ?? 0),
              thumbnail: it.thumbnail ?? null,
            },
            update: {
              title: it.title ?? '',
              status: it.status ?? 'unknown',
              price: Number(it.price ?? 0),
              available: Number(it.available_quantity ?? 0),
              thumbnail: it.thumbnail ?? null,
            },
          });
          st.itemsProcessed += 1;
        } catch (e: any) {
          st.errors.push(`item ${id}: ${e?.response?.status || ''} ${e?.message || e}`);
          await sleep(500);
        }
      }

      offset += limit;
      await sleep(500);
    }
  }

  private async syncOrders(sellerId: string, accountId: string, authCtx: { accessToken: string; refreshToken: string }, days: number, st: Status) {
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const qs = new URLSearchParams({
      seller: String(sellerId),
      sort: 'date_desc',
      'order.date_created.from': from.toISOString(),
    }).toString();

    let offset = 0;
    const limit = 50;
    for (let page = 0; page < 10; page++) { // cap 500 results MVP
      const url = `https://api.mercadolibre.com/orders/search?${qs}&limit=${limit}&offset=${offset}`;
      const resp = await this.authedGet(url, accountId, authCtx, 20000);
      const results = resp.data?.results || [];
      if (!results.length) break;

      for (const o of results) {
        try {
          const id = String(o.id);
          await this.prisma.order.upsert({
            where: { meliOrderId: id },
            create: {
              accountId,
              meliOrderId: id,
              status: o.status ?? 'unknown',
              totalAmount: Number(o.total_amount ?? 0),
              dateCreated: new Date(o.date_created ?? Date.now()),
              buyerId: o.buyer?.id ? String(o.buyer.id) : null,
            },
            update: {
              status: o.status ?? 'unknown',
              totalAmount: Number(o.total_amount ?? 0),
              dateCreated: new Date(o.date_created ?? Date.now()),
              buyerId: o.buyer?.id ? String(o.buyer.id) : null,
            },
          });
          st.ordersProcessed += 1;
        } catch (e: any) {
          st.errors.push(`order upsert: ${e?.response?.status || ''} ${e?.message || e}`);
          await sleep(500);
        }
      }

      offset += limit;
      await sleep(500);
    }
  }

  private async syncShipments(accountId: string, authCtx: { accessToken: string; refreshToken: string }, st: Status) {
    // Busca todos os pedidos e sincroniza seus shipments
    const orders = await this.prisma.order.findMany({
      where: { accountId },
      select: { meliOrderId: true },
    });

    for (const order of orders) {
      try {
        const orderUrl = `https://api.mercadolibre.com/orders/${order.meliOrderId}`;
        const resp = await this.authedGet(orderUrl, accountId, authCtx, 15000);
        const orderData = resp.data;

        if (orderData.shipping?.id) {
          const shipmentId = String(orderData.shipping.id);
          const shipmentUrl = `https://api.mercadolibre.com/shipments/${shipmentId}`;
          const shipResp = await this.authedGet(shipmentUrl, accountId, authCtx, 15000);
          const shipData = shipResp.data;

          await this.prisma.shipment.upsert({
            where: { meliShipmentId: shipmentId },
            create: {
              accountId,
              meliShipmentId: shipmentId,
              orderId: order.meliOrderId,
              mode: shipData.mode || 'unknown',
              status: shipData.status || 'unknown',
              substatus: shipData.substatus,
              trackingNumber: shipData.tracking_number,
              trackingMethod: shipData.tracking_method,
              estimatedDelivery: shipData.estimated_delivery_time?.date
                ? new Date(shipData.estimated_delivery_time.date)
                : null,
              shippedDate: shipData.status_history?.shipped?.date_shipped
                ? new Date(shipData.status_history.shipped.date_shipped)
                : null,
              deliveredDate: shipData.status_history?.delivered?.date_delivered
                ? new Date(shipData.status_history.delivered.date_delivered)
                : null,
              receiverAddress: shipData.receiver_address
                ? JSON.stringify(shipData.receiver_address)
                : null,
              senderAddress: shipData.sender_address
                ? JSON.stringify(shipData.sender_address)
                : null,
              cost: shipData.cost || 0,
            },
            update: {
              status: shipData.status || 'unknown',
              substatus: shipData.substatus,
              trackingNumber: shipData.tracking_number,
              trackingMethod: shipData.tracking_method,
              estimatedDelivery: shipData.estimated_delivery_time?.date
                ? new Date(shipData.estimated_delivery_time.date)
                : null,
              shippedDate: shipData.status_history?.shipped?.date_shipped
                ? new Date(shipData.status_history.shipped.date_shipped)
                : null,
              deliveredDate: shipData.status_history?.delivered?.date_delivered
                ? new Date(shipData.status_history.delivered.date_delivered)
                : null,
              receiverAddress: shipData.receiver_address
                ? JSON.stringify(shipData.receiver_address)
                : null,
              senderAddress: shipData.sender_address
                ? JSON.stringify(shipData.sender_address)
                : null,
              cost: shipData.cost || 0,
            },
          });

          st.shipmentsProcessed += 1;
        }
      } catch (e: any) {
        st.errors.push(`shipment ${order.meliOrderId}: ${e?.response?.status || ''} ${e?.message || e}`);
        await sleep(500);
      }
    }
  }

  private async syncQuestions(sellerId: string, accountId: string, authCtx: { accessToken: string; refreshToken: string }, st: Status) {
    let offset = 0;
    const limit = 50;

    for (let page = 0; page < 10; page++) { // cap 500 questions
      const url = `https://api.mercadolibre.com/questions/search?seller_id=${sellerId}&limit=${limit}&offset=${offset}`;
      const resp = await this.authedGet(url, accountId, authCtx, 15000);
      const questions = resp.data?.questions || [];
      if (!questions.length) break;

      for (const q of questions) {
        try {
          const questionId = String(q.id);
          await this.prisma.question.upsert({
            where: { meliQuestionId: questionId },
            create: {
              accountId,
              meliQuestionId: questionId,
              itemId: q.item_id,
              text: q.text,
              status: q.status,
              answer: q.answer?.text || null,
              dateCreated: new Date(q.date_created),
              dateAnswered: q.answer?.date_created
                ? new Date(q.answer.date_created)
                : null,
              fromId: String(q.from.id),
            },
            update: {
              status: q.status,
              answer: q.answer?.text || null,
              dateAnswered: q.answer?.date_created
                ? new Date(q.answer.date_created)
                : null,
            },
          });

          st.questionsProcessed += 1;
        } catch (e: any) {
          st.errors.push(`question ${q.id}: ${e?.response?.status || ''} ${e?.message || e}`);
          await sleep(500);
        }
      }

      offset += limit;
      await sleep(500);
    }
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Helpers for authorized requests with refresh on 401
declare global {
  // allow NodeJS to augment types if needed
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS { interface ProcessEnv { MELI_CLIENT_ID?: string; MELI_CLIENT_SECRET?: string } }
}

export interface AxiosResp<T=any> { data: T; status: number }

// Attach as methods on class
export interface SyncService {
  authedGet<T=any>(url: string, accountId: string, authCtx: { accessToken: string; refreshToken: string }, timeout?: number): Promise<AxiosResp<T>>
  refreshToken(accountId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>
}

SyncService.prototype.authedGet = async function<T=any>(this: SyncService, url: string, accountId: string, authCtx: { accessToken: string; refreshToken: string }, timeout = 15000): Promise<AxiosResp<T>> {
  try {
    return await axios.get<T>(url, { headers: { Authorization: `Bearer ${authCtx.accessToken}` }, timeout });
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401) {
      // refresh and retry once
      const tokens = await this.refreshToken(accountId, authCtx.refreshToken);
      authCtx.accessToken = tokens.accessToken;
      authCtx.refreshToken = tokens.refreshToken;
      return await axios.get<T>(url, { headers: { Authorization: `Bearer ${authCtx.accessToken}` }, timeout });
    }
    throw e;
  }
}

SyncService.prototype.refreshToken = async function(this: SyncService, accountId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const clientId = process.env.MELI_CLIENT_ID || '';
  const clientSecret = process.env.MELI_CLIENT_SECRET || '';
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('refresh_token', refreshToken);
  const tokenUrl = 'https://api.mercadolibre.com/oauth/token';
  const resp = await axios.post(tokenUrl, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
  const data = resp.data as { access_token: string; refresh_token: string; token_type?: string; scope?: string; expires_in: number };

  // Busca conta para salvar tokens criptografados
  // @ts-ignore access prisma via 'this' cast
  const prisma = (this as any).prisma as PrismaService;
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('account_not_found');

  // @ts-ignore access accountsService via 'this' cast
  const accountsService = (this as any).accountsService as AccountsService;
  await accountsService.saveAccountWithTokens(
    { sellerId: account.sellerId },
    {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || '',
      expiresIn: data.expires_in,
    },
  );

  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}
