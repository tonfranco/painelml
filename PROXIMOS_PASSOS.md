# 🚀 Próximos Passos - Roadmap Fase 3

## ✅ Fase 2 Completa

Você tem agora:
- ✅ OAuth funcionando com tokens criptografados
- ✅ Webhooks com dedupe persistente
- ✅ Backfill de itens e pedidos
- ✅ UI básica funcional
- ✅ PostgreSQL + Docker
- ✅ Documentação completa

## 🎯 Fase 3 - Melhorias e Produção

### 1. Dashboard com Métricas (Prioridade Alta)

**Objetivo**: Visualizar KPIs em tempo real

**Implementação**:
```typescript
// backend/src/dashboard/dashboard.controller.ts
@Get('dashboard')
async getDashboard(@Query('accountId') accountId?: string) {
  const [accounts, items, orders, webhooks] = await Promise.all([
    this.accountsService.count(),
    this.itemsService.getStats(accountId),
    this.ordersService.getStats(accountId),
    this.webhooksService.getStats(),
  ]);

  return {
    accounts,
    items,
    orders,
    webhooks,
    revenue: orders.totalAmount,
    conversionRate: orders.paid / orders.total,
  };
}
```

**Frontend**:
- Instalar: `npm install recharts`
- Criar: `frontend/src/app/dashboard/page.tsx`
- Gráficos: vendas por dia, produtos mais vendidos, status de pedidos

**Tempo estimado**: 4-6 horas

---

### 2. Worker para Processar Webhooks (Prioridade Alta)

**Objetivo**: Processar webhooks pendentes em background

**Implementação**:
```typescript
// backend/src/workers/webhook-worker.service.ts
@Injectable()
export class WebhookWorkerService {
  @Cron('*/5 * * * *') // A cada 5 minutos
  async processePendingWebhooks() {
    const pending = await this.webhooksService.getPendingEvents(10);
    
    for (const event of pending) {
      try {
        await this.processWebhook(event);
        await this.webhooksService.markAsProcessed(event.id);
      } catch (error) {
        await this.webhooksService.incrementAttempts(event.id);
      }
    }
  }
}
```

**Dependências**:
- `npm install @nestjs/schedule`

**Tempo estimado**: 3-4 horas

---

### 3. Notificações em Tempo Real (Prioridade Média)

**Objetivo**: Notificar usuário de novos pedidos/mensagens

**Implementação Backend**:
```typescript
// backend/src/notifications/notifications.gateway.ts
@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  notifyNewOrder(order: Order) {
    this.server.emit('new-order', order);
  }
}
```

**Implementação Frontend**:
```typescript
// frontend/src/hooks/useWebSocket.ts
import { io } from 'socket.io-client';

export function useWebSocket() {
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.on('new-order', (order) => {
      toast.success(`Novo pedido: ${order.meliOrderId}`);
    });

    return () => socket.disconnect();
  }, []);
}
```

**Dependências**:
- Backend: `npm install @nestjs/websockets @nestjs/platform-socket.io`
- Frontend: `npm install socket.io-client react-hot-toast`

**Tempo estimado**: 4-5 horas

---

### 4. Filtros e Busca Avançada (Prioridade Média)

**Objetivo**: Filtrar produtos e pedidos por múltiplos critérios

**Backend**:
```typescript
@Get('items')
async list(
  @Query('status') status?: string,
  @Query('minPrice') minPrice?: number,
  @Query('maxPrice') maxPrice?: number,
  @Query('search') search?: string,
) {
  const where = {
    ...(status && { status }),
    ...(minPrice && { price: { gte: minPrice } }),
    ...(maxPrice && { price: { lte: maxPrice } }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
  };

  return this.prisma.item.findMany({ where });
}
```

**Frontend**:
- Adicionar inputs de filtro
- Debounce na busca
- Query params na URL

**Tempo estimado**: 3-4 horas

---

### 5. Paginação (Prioridade Média)

**Objetivo**: Lidar com grandes volumes de dados

**Backend**:
```typescript
@Get('items')
async list(
  @Query('page') page = 1,
  @Query('limit') limit = 20,
) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    this.prisma.item.findMany({ skip, take: limit }),
    this.prisma.item.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
```

**Frontend**:
- Componente de paginação
- Navegação entre páginas
- Indicador de página atual

**Tempo estimado**: 2-3 horas

---

### 6. Detalhes de Item/Pedido (Prioridade Baixa)

**Objetivo**: Ver informações completas

**Rotas**:
- `/catalog/[id]` - Detalhes do produto
- `/orders/[id]` - Detalhes do pedido

**Informações adicionais**:
- Histórico de mudanças
- Imagens completas
- Descrição
- Variações
- Envio
- Pagamento

**Tempo estimado**: 4-6 horas

---

### 7. Gestão de Estoque (Prioridade Baixa)

**Objetivo**: Atualizar quantidade disponível

**Implementação**:
```typescript
@Patch('items/:id/stock')
async updateStock(
  @Param('id') id: string,
  @Body('quantity') quantity: number,
) {
  // Atualizar no banco
  await this.prisma.item.update({
    where: { id },
    data: { available: quantity },
  });

  // Sincronizar com ML
  await this.meliService.updateItem(item.meliItemId, { available_quantity: quantity });
}
```

**Tempo estimado**: 3-4 horas

---

### 8. Relatórios e Exportação (Prioridade Baixa)

**Objetivo**: Exportar dados para análise

**Formatos**:
- CSV
- Excel
- PDF

**Implementação**:
```typescript
@Get('orders/export')
async export(@Query('format') format: 'csv' | 'xlsx' | 'pdf') {
  const orders = await this.ordersService.list();
  
  if (format === 'csv') {
    return this.csvService.generate(orders);
  }
  // ...
}
```

**Dependências**:
- `npm install papaparse xlsx pdfkit`

**Tempo estimado**: 4-5 horas

---

### 9. Multi-tenancy (Prioridade Baixa)

**Objetivo**: Suportar múltiplos usuários

**Mudanças necessárias**:
1. Adicionar tabela `User`
2. Adicionar autenticação (NextAuth.js)
3. Relacionar `Account` com `User`
4. Filtrar dados por usuário logado

**Tempo estimado**: 8-12 horas

---

### 10. Deploy em Produção (Prioridade Alta)

**Opções**:

#### Backend
- **Railway** (recomendado): PostgreSQL + NestJS
- **Render**: Free tier disponível
- **Fly.io**: Bom para Docker
- **AWS/GCP**: Mais controle

#### Frontend
- **Vercel** (recomendado): Deploy automático
- **Netlify**: Alternativa
- **Cloudflare Pages**: Rápido

**Checklist de Produção**:
- [ ] Variáveis de ambiente configuradas
- [ ] `ENCRYPTION_KEY` forte e única
- [ ] PostgreSQL em produção (não SQLite)
- [ ] HTTPS obrigatório
- [ ] Rate limiting ativado
- [ ] Logs estruturados
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Backup automático do banco
- [ ] CI/CD configurado (GitHub Actions)

**Tempo estimado**: 6-8 horas

---

## 🛠️ Melhorias Técnicas

### Performance
- [ ] Cache com Redis (produtos, stats)
- [ ] CDN para imagens (Cloudinary)
- [ ] Lazy loading de imagens
- [ ] Server-side rendering (SSR)
- [ ] Compressão de responses (gzip)

### Segurança
- [ ] Rate limiting por IP
- [ ] CORS restritivo
- [ ] Helmet.js para headers
- [ ] Validação de inputs (class-validator)
- [ ] SQL injection protection (Prisma já faz)
- [ ] XSS protection

### Observabilidade
- [ ] Logs estruturados (Pino)
- [ ] APM (New Relic, Datadog)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Posthog, Mixpanel)
- [ ] Uptime monitoring (UptimeRobot)

### Testes
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Coverage > 80%

---

## 📅 Cronograma Sugerido

### Semana 1
- [ ] Dashboard com métricas
- [ ] Worker para webhooks
- [ ] Filtros e busca

### Semana 2
- [ ] Paginação
- [ ] Notificações real-time
- [ ] Detalhes de item/pedido

### Semana 3
- [ ] Melhorias de performance
- [ ] Testes automatizados
- [ ] Documentação de API (Swagger)

### Semana 4
- [ ] Deploy em produção
- [ ] Monitoring e logs
- [ ] Backup e recovery

---

## 🎯 Priorização

### Must Have (Fazer primeiro)
1. Dashboard com métricas
2. Worker para webhooks
3. Deploy em produção

### Should Have (Importante)
4. Filtros e busca
5. Paginação
6. Notificações real-time

### Nice to Have (Se houver tempo)
7. Detalhes completos
8. Gestão de estoque
9. Relatórios
10. Multi-tenancy

---

## 💡 Ideias Futuras

### Integrações
- ML Chat (responder mensagens)
- ML Envios (rastreamento)
- ML Publicidade (campanhas)
- Correios (rastreamento)
- Nota Fiscal (emissão automática)

### Features Avançadas
- IA para precificação dinâmica
- Análise de concorrência
- Sugestões de produtos
- Automação de respostas
- Previsão de vendas

### Mobile
- App React Native
- Notificações push
- Scanner de código de barras

---

## 📚 Recursos Úteis

### Documentação
- [Mercado Livre API](https://developers.mercadolibre.com.br/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Ferramentas
- [Postman](https://www.postman.com/) - Testar APIs
- [Prisma Studio](https://www.prisma.io/studio) - GUI do banco
- [Sentry](https://sentry.io/) - Error tracking
- [Vercel](https://vercel.com/) - Deploy frontend

### Comunidades
- [NestJS Discord](https://discord.gg/nestjs)
- [Prisma Discord](https://discord.gg/prisma)
- [ML Developers](https://developers.mercadolibre.com.br/community)

---

## ✅ Conclusão

Você tem uma base sólida. Escolha 2-3 itens da lista "Must Have" e comece por eles.

**Recomendação**: Comece pelo **Dashboard** (impacto visual) e **Worker de Webhooks** (confiabilidade).

Boa sorte! 🚀
