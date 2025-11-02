# 🧪 Teste da API de Billing do Mercado Livre

Este guia mostra como testar se sua conta tem acesso às APIs de Billing do Mercado Livre.

## 📋 O que será testado

1. **Períodos de Faturamento** - `/billing/integration/monthly/periods`
2. **Summary de Período** - `/billing/integration/periods/key/{KEY}/summary`
3. **Perceptions Summary** - `/billing/integration/periods/key/{KEY}/perceptions/summary`

## 🚀 Como Executar

### Opção 1: Script Automático (Recomendado)

```bash
# Na raiz do projeto painelml
bash test-ml-billing.sh
```

Este script irá:
- ✅ Buscar automaticamente o access token do banco de dados
- ✅ Descriptografar o token
- ✅ Testar todos os endpoints de billing
- ✅ Mostrar os resultados de forma organizada

### Opção 2: Passo a Passo Manual

#### 1. Obter o Access Token

```bash
cd backend
node ../get-token.js
```

Isso mostrará o comando completo com o token.

#### 2. Executar o Teste

Copie e execute o comando mostrado no passo anterior:

```bash
ML_ACCESS_TOKEN="seu_token_aqui" node ../test-billing-api.js
```

## 📊 Resultados Esperados

### ✅ Sucesso (Conta com acesso à API)

```
🔍 Testando APIs de Billing do Mercado Livre

1️⃣  Buscando períodos de faturamento...
Status: 200 OK
✅ 12 períodos encontrados

📋 Períodos mais recentes:
   1. 2024-10 - R$ 1234.56
   2. 2024-09 - R$ 987.65
   3. 2024-08 - R$ 543.21

2️⃣  Testando Summary do período: 2024-10
Status: 200 OK
✅ Summary obtido com sucesso

3️⃣  Testando Perceptions do período: 2024-10
Status: 200 OK
✅ Perceptions obtido com sucesso
```

### ⚠️ API Não Disponível (Normal para muitas contas)

```
1️⃣  Buscando períodos de faturamento...
Status: 403 Forbidden
❌ Erro: ...
⚠️  API de billing não disponível para esta conta.
   Isso é normal para contas que não têm acesso à API de integração.
```

### ℹ️ Perceptions Não Disponível

```
3️⃣  Testando Perceptions do período: 2024-10
Status: 404 Not Found
ℹ️  Endpoint de perceptions não disponível ou não há dados de percepções para este período.
```

## 🔍 O que Significa Cada Resultado

### API de Billing Disponível (200 OK)
- ✅ Sua conta tem acesso à API de integração do ML
- ✅ O sistema pode buscar valores reais de taxas e impostos
- ✅ Relatórios financeiros terão dados precisos

### API de Billing Não Disponível (403/404)
- ⚠️ Sua conta não tem acesso à API de integração
- ⚠️ Isso é **normal** para a maioria das contas
- ℹ️ O sistema usará dados de pedidos como alternativa
- ℹ️ Taxas ML/MP serão estimadas ou zeradas

### Perceptions Não Disponível (404)
- ℹ️ Endpoint específico de percepções não está disponível
- ℹ️ Pode ser que não haja dados de percepções para o período
- ℹ️ Ou o endpoint não existe para sua região/tipo de conta

## 📝 Notas Importantes

1. **Access Token Temporário**: O token tem validade limitada. Se expirar, você precisará reconectar a conta.

2. **Permissões**: Nem todas as contas do Mercado Livre têm acesso à API de Billing. Isso depende do tipo de conta e região.

3. **Alternativa**: Se a API não estiver disponível, o sistema continuará funcionando usando dados de pedidos.

4. **Segurança**: Os tokens são criptografados no banco de dados e descriptografados apenas quando necessário.

## 🛠️ Troubleshooting

### Erro: "Nenhuma conta encontrada"
- Certifique-se de ter conectado uma conta do ML
- Acesse http://localhost:4000/meli/oauth/start para conectar

### Erro: "Erro ao descriptografar"
- Verifique se a `ENCRYPTION_KEY` no `.env.local` está correta
- A chave deve ser a mesma usada para criptografar os tokens

### Erro: "Token expirado"
- Reconecte a conta do Mercado Livre
- Os tokens expiram após algumas horas

## 📚 Referências

- [Documentação ML - Billing API](https://developers.mercadolibre.com.br/)
- [OAuth 2.0 - Mercado Livre](https://developers.mercadolibre.com.br/pt_br/autenticacao-e-autorizacao)
