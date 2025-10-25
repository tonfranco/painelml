// Types para o Painel ML

export interface Account {
  id: string;
  sellerId: string;
  nickname?: string;
  siteId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  accountId: string;
  meliItemId: string;
  title: string;
  status: 'active' | 'paused' | 'closed';
  price: number;
  available: number;
  sold: number;
  thumbnail?: string;
  picture?: string; // Imagem em alta resolução
  permalink?: string;
  categoryId?: string;
  listingType?: string;
  condition?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Order {
  id: string;
  accountId: string;
  meliOrderId: string;
  status: string;
  totalAmount: number;
  dateCreated: string;
  buyerId: string;
  buyerNickname?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  accountId: string;
  meliShipmentId: string;
  orderId?: string;
  mode: string;
  status: string;
  substatus?: string;
  trackingNumber?: string;
  trackingMethod?: string;
  estimatedDelivery?: string;
  shippedDate?: string;
  deliveredDate?: string;
  receiverAddress?: string;
  senderAddress?: string;
  cost?: number;
  updatedAt: string;
  createdAt: string;
}

export interface Question {
  id: string;
  accountId: string;
  meliQuestionId: string;
  itemId?: string;
  text: string;
  status: 'UNANSWERED' | 'ANSWERED' | 'CLOSED_UNANSWERED' | 'UNDER_REVIEW' | 'BANNED' | 'DELETED';
  answer?: string;
  dateCreated: string;
  dateAnswered?: string;
  fromId: string;
  updatedAt: string;
  createdAt: string;
}

export interface ItemsStats {
  total: number;
  active: number;
  paused: number;
  closed: number;
}

export interface OrdersStats {
  total: number;
  paid: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  totalAmount: number;
}

export interface ShipmentsStats {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
}

export interface QuestionsStats {
  total: number;
  unanswered: number;
  answered: number;
  overdueSLA: number;
}

export interface SyncStatus {
  running: boolean;
  startedAt?: number;
  finishedAt?: number;
  itemsProcessed?: number;
  ordersProcessed?: number;
  shipmentsProcessed?: number;
  questionsProcessed?: number;
  errors?: string[];
}
