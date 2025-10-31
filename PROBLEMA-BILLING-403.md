# 🔧 Problema: Erro 403 ao Sincronizar Billing

## ❌ **Problema Identificado**

Ao clicar em "Sincronizar" na página Financeiro, ocorre o erro:
```
ML API error: 403
ERROR [BillingController] Error syncing billing: ML API error: 403
```

## 🔍 **Causa Raiz**

O erro **403 (Forbidden)** acontece porque:

1. **Falta de Escopos OAuth**: A autenticação inicial não estava solicitando os escopos necessários para acessar a API de billing do Mercado Livre
2. **Token sem Permissões**: O token de acesso atual não tem permissão para acessar `/billing/integration/monthly/periods`

## ✅ **Solução Implementada**

### **1. Adicionado Escopos OAuth**

**Arquivo:** `/backend/src/meli/meli.service.ts`

```typescript
// Antes (SEM escopos)
url.searchParams.set('state', state);
url.searchParams.set('code_challenge', challenge);

// Depois (COM escopos)
url.searchParams.set('state', state);
url.searchParams.set('code_challenge', challenge);
url.searchParams.set('scope', 'offline_access read write');
```

### **2. Melhorado Tratamento de Erros**

**Arquivo:** `/backend/src/billing/billing.service.ts`

```typescript
if (response.status === 403) {
  throw new Error(
    'Acesso negado à API de billing. Verifique se o aplicativo tem as permissões necessárias (read_billing_info). ' +
    'Você pode precisar reautorizar a aplicação com os escopos corretos.'
  );
}
```

## 🔄 **Como Corrigir**

### **Opção 1: Reautorizar a Conta (RECOMENDADO)**

1. **Desconectar a conta atual:**
   - Vá em **Configurações**
   - Clique em **"Desconectar Conta"**

2. **Reconectar com novos escopos:**
   - Clique em **"Conectar Conta Mercado Livre"**
   - Autorize novamente
   - Agora o token terá os escopos corretos!

3. **Testar sincronização:**
   - Vá em **Financeiro**
   - Clique em **"Sincronizar"**
   - Deve funcionar! ✅

### **Opção 2: Atualizar Token Manualmente (Avançado)**

Se você não quiser desconectar:

1. Acesse: `https://auth.mercadolibre.com/authorization?response_type=code&client_id=SEU_CLIENT_ID&redirect_uri=SEU_REDIRECT_URI&scope=offline_access read write`
2. Autorize novamente
3. O sistema atualizará o token automaticamente

## 📋 **Escopos do Mercado Livre**

| Escopo | Descrição |
|--------|-----------|
| `offline_access` | Permite refresh token (token não expira) |
| `read` | Leitura de dados (pedidos, produtos, billing) |
| `write` | Escrita de dados (atualizar produtos, responder perguntas) |

## ⚠️ **Importante**

- **Contas antigas** (conectadas antes desta correção) precisam ser **reautorizadas**
- **Contas novas** (conectadas após esta correção) funcionarão automaticamente
- O erro 403 só será resolvido após **reautorização**

## 🧪 **Verificar se Funcionou**

Após reautorizar:

1. ✅ **Financeiro → Sincronizar** deve funcionar
2. ✅ Períodos de billing devem aparecer
3. ✅ Gráficos devem mostrar dados reais
4. ✅ Não deve mais aparecer erro 403

## 📚 **Referências**

- [Documentação OAuth ML](https://developers.mercadolibre.com.br/pt_br/autenticacao-e-autorizacao)
- [API de Billing](https://developers.mercadolibre.com.br/pt_br/billing)
