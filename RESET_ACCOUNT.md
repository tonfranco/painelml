# 🔄 Reset de Conta do Mercado Livre

## 📋 O que este processo faz?

Este script permite **limpar completamente** todos os dados de uma conta do Mercado Livre do sistema e reconectar com uma nova autenticação.

### Dados que serão deletados:
- ✅ Tokens de acesso (OAuth)
- ✅ Produtos sincronizados
- ✅ Pedidos (Orders)
- ✅ Envios (Shipments)
- ✅ Perguntas e respostas
- ✅ Períodos de billing
- ✅ Charges de billing
- ✅ Pagamentos de billing
- ✅ Despesas cadastradas
- ✅ Impostos/taxas cadastrados
- ✅ Receitas extras
- ✅ Configurações da conta

**⚠️ ATENÇÃO**: Esta ação é **IRREVERSÍVEL**! Todos os dados serão permanentemente deletados do banco de dados.

---

## 🚀 Como Usar

### Passo 1: Executar o Script de Reset

```bash
cd /Users/tonfranco/projetos/painelML/painelml
node reset-account.js
```

O script irá:
1. Listar todas as contas encontradas
2. Mostrar quantos dados cada conta possui
3. Pedir confirmação (você deve digitar "SIM")
4. Deletar a conta e todos os dados relacionados

### Passo 2: Reconectar com o Mercado Livre

Após deletar a conta, você precisa fazer uma nova autenticação:

#### 2.1. Certifique-se que o backend está rodando
```bash
cd backend
npm run start:dev
```

#### 2.2. Acesse o endpoint de OAuth
Abra no navegador:
```
http://localhost:4000/meli/oauth/start
```

Ou se estiver usando Cloudflare Tunnel:
```
https://lives-huge-others-stopping.trycloudflare.com/meli/oauth/start
```

#### 2.3. Faça login no Mercado Livre
- Digite suas credenciais
- Autorize o aplicativo
- Aguarde o redirecionamento

### Passo 3: Obter o Novo Account ID

```bash
node get-account-id.js
```

Isso mostrará o novo `accountId` gerado.

### Passo 4: Sincronizar os Dados

Com o novo `accountId`, sincronize os dados:

```bash
# Substitua NEW_ACCOUNT_ID pelo ID obtido no passo 3

# Produtos
curl -X POST "http://localhost:4000/items/sync?accountId=NEW_ACCOUNT_ID"

# Pedidos
curl -X POST "http://localhost:4000/orders/sync?accountId=NEW_ACCOUNT_ID"

# Perguntas
curl -X POST "http://localhost:4000/questions/sync?accountId=NEW_ACCOUNT_ID"

# Billing (se disponível)
curl -X POST "http://localhost:4000/billing/sync?accountId=NEW_ACCOUNT_ID"
```

---

## 🔧 Opções Avançadas

### Deletar Apenas Dados Específicos

Se você quiser deletar apenas alguns tipos de dados sem resetar a conta completa, pode usar o Prisma Studio:

```bash
cd backend
npx prisma studio
```

Então navegue até a tabela desejada e delete os registros manualmente.

### Deletar Todas as Contas

Se quiser deletar **todas** as contas do sistema:

```bash
cd backend
npx prisma migrate reset
```

⚠️ **CUIDADO**: Isso irá resetar o banco de dados inteiro!

---

## 📊 Verificar Dados Antes de Deletar

Para ver quantos dados você tem antes de deletar:

```bash
node reset-account.js
```

O script mostrará um resumo antes de pedir confirmação.

---

## 🆘 Troubleshooting

### Erro: "Account not found"
- A conta já foi deletada ou nunca foi criada
- Execute `node get-account-id.js` para verificar

### Erro: "Cannot delete account"
- Pode haver restrições de foreign key
- Verifique se o cascade está configurado corretamente no schema

### Erro: "OAuth redirect failed"
- Verifique se o `MELI_REDIRECT_URI` no `.env.local` está correto
- Certifique-se que o backend está rodando
- Se usar Cloudflare Tunnel, verifique se está ativo

### Token Expirado
- Tokens do ML expiram após algumas horas
- Faça uma nova autenticação seguindo o Passo 2

---

## 📝 Exemplo Completo

```bash
# 1. Reset da conta
node reset-account.js
# Digite "SIM" quando solicitado

# 2. Abra o navegador e acesse:
# http://localhost:4000/meli/oauth/start

# 3. Após autenticar, obtenha o novo ID
node get-account-id.js

# 4. Sincronize os dados (exemplo com ID fictício)
curl -X POST "http://localhost:4000/items/sync?accountId=cmh3r4euy0000ytriw7xq545g"
curl -X POST "http://localhost:4000/orders/sync?accountId=cmh3r4euy0000ytriw7xq545g"
curl -X POST "http://localhost:4000/questions/sync?accountId=cmh3r4euy0000ytriw7xq545g"
```

---

## 🔐 Segurança

- ✅ O script pede confirmação antes de deletar
- ✅ Você deve digitar "SIM" (em maiúsculas) para confirmar
- ✅ Mostra um resumo dos dados antes de deletar
- ✅ Não deleta automaticamente sem interação do usuário

---

## 💡 Dicas

1. **Backup antes de resetar**: Se tiver dados importantes, faça backup do banco antes
2. **Teste em desenvolvimento**: Teste o processo em ambiente de dev primeiro
3. **Anote o accountId**: Salve o novo accountId em um lugar seguro
4. **Sincronize gradualmente**: Sincronize um tipo de dado por vez para monitorar

---

**Pronto para começar? Execute:**
```bash
node reset-account.js
```
