# 🚀 Como Iniciar o Sistema - Guia Completo

## 📋 Pré-requisitos

- ✅ Docker Desktop instalado e rodando
- ✅ Node.js 18+ instalado
- ✅ Dependências instaladas (npm install)

---

## 🔧 Passo a Passo

### 1. Iniciar Docker (Postgres + LocalStack)

```bash
# Na raiz do projeto
docker compose up -d

# Verificar se está rodando
docker compose ps

# Deve mostrar:
# - painelml-postgres (porta 5432)
# - painelml-localstack (porta 4566)
```

**Aguarde ~30 segundos** para o LocalStack inicializar completamente.

---

### 2. Verificar Variáveis de Ambiente do Backend

```bash
cd backend
cat .env.local
```

**Deve conter:**
```bash
# Database
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml?schema=public"

# Encryption
ENCRYPTION_KEY="669b6ec3b9bcce0061a18ac3cf5e805d65c23559d9982f6cb8fc2ff9871a2670"

# Mercado Livre OAuth
MELI_CLIENT_ID="8780271440058520"
MELI_CLIENT_SECRET="5SZaA9RU5d33iFVU2tCIBdatIJO3qOKv"
MELI_REDIRECT_URI="https://reflects-relation-jackie-characteristics.trycloudflare.com/meli/oauth/callback"

# App URLs
APP_BASE_URL="https://reflects-relation-jackie-characteristics.trycloudflare.com"
FRONTEND_BASE_URL="http://localhost:3000"

# Cookie Secret
COOKIE_SECRET="your-random-secret-for-cookies"

# AWS SQS / LocalStack
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
SQS_ENDPOINT="http://localhost:4566"
SQS_QUEUE_NAME="painelml-webhooks"
```

---

### 3. Iniciar Backend

```bash
# Ainda no diretório backend/
npm run start:dev
```

**Aguarde a mensagem:**
```
[Nest] Application is running on: http://localhost:4000
```

**Se der erro de SQS:**
- Aguarde mais 30 segundos para o LocalStack inicializar
- Ou reinicie: `Ctrl+C` e `npm run start:dev` novamente

---

### 4. Testar Backend

**Em outro terminal:**

```bash
# Testar endpoint raiz
curl http://localhost:4000

# Deve retornar algo como:
# {"message":"Painel ML API is running"}

# Testar accounts
curl http://localhost:4000/accounts

# Deve retornar array (vazio ou com contas)
```

---

### 5. Iniciar Frontend

**Em outro terminal:**

```bash
cd frontend
npm run dev
```

**Aguarde a mensagem:**
```
▲ Next.js 16.0.0 (Turbopack)
- Local:        http://localhost:3000
```

---

### 6. Acessar Aplicação

Abra no navegador: **http://localhost:3000**

---

## 🧪 Fluxo de Teste Completo

### Teste 1: Conectar Conta do ML

1. Na home, clique em **"Conectar Conta do Mercado Livre"**
2. Você será redirecionado para o ML
3. Faça login e autorize
4. Será redirecionado de volta para `/products`

### Teste 2: Ver Produtos

1. Após conectar, você deve ver a lista de produtos
2. Teste os filtros:
   - Busca por nome
   - Filtro por status
   - Ordenação
3. Clique em **"Ver detalhes"** em um produto
4. Modal deve abrir com informações completas

### Teste 3: Navegação

1. Use a sidebar para navegar:
   - Dashboard
   - Produtos
   - Pedidos (ainda não implementado)
   - Perguntas (ainda não implementado)

### Teste 4: Dashboard

1. Vá para `/dashboard`
2. Deve mostrar:
   - Total de produtos
   - Pedidos (30 dias)
   - Faturamento
   - Perguntas pendentes

---

## ❌ Troubleshooting

### Erro: "Could not load credentials from any providers"

**Causa:** LocalStack não está rodando ou não inicializou

**Solução:**
```bash
# Verificar LocalStack
docker logs painelml-localstack

# Reiniciar
docker compose restart localstack

# Aguardar 30 segundos e tentar novamente
```

---

### Erro: "Connection refused" no Postgres

**Causa:** Postgres não está rodando

**Solução:**
```bash
# Verificar Postgres
docker compose ps

# Se não estiver rodando
docker compose up -d postgres

# Testar conexão
docker exec painelml-postgres pg_isready -U painelml
```

---

### Erro: "Module not found" no Frontend

**Causa:** Dependências não instaladas

**Solução:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Frontend não carrega dados

**Causa:** Backend não está rodando ou variável de ambiente errada

**Solução:**
```bash
# Verificar se backend está rodando
curl http://localhost:4000

# Verificar .env.local do frontend
cd frontend
cat .env.local

# Deve ter:
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### Nenhuma conta conectada

**Causa:** OAuth não foi feito ou accountId não foi salvo

**Solução:**
1. Abra DevTools (F12)
2. Console → digite: `localStorage.getItem('accountId')`
3. Se retornar `null`, faça o OAuth novamente
4. Ou defina manualmente (temporário):
   ```javascript
   localStorage.setItem('accountId', 'SEU_ACCOUNT_ID')
   ```

---

## 🎯 Checklist de Inicialização

- [ ] Docker Desktop rodando
- [ ] `docker compose up -d` executado
- [ ] Postgres rodando (porta 5432)
- [ ] LocalStack rodando (porta 4566)
- [ ] Backend iniciado (`npm run start:dev`)
- [ ] Backend respondendo em http://localhost:4000
- [ ] Frontend iniciado (`npm run dev`)
- [ ] Frontend acessível em http://localhost:3000
- [ ] Conta do ML conectada
- [ ] Produtos carregando

---

## 📊 Status dos Serviços

### Verificar Tudo de Uma Vez

```bash
#!/bin/bash

echo "🔍 Verificando serviços..."
echo ""

# Docker
echo "📦 Docker Compose:"
docker compose ps
echo ""

# Backend
echo "🔧 Backend (porta 4000):"
curl -s http://localhost:4000 | jq || echo "❌ Backend não está respondendo"
echo ""

# Frontend
echo "🎨 Frontend (porta 3000):"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend está rodando" || echo "❌ Frontend não está rodando"
echo ""

# LocalStack
echo "☁️  LocalStack (porta 4566):"
curl -s http://localhost:4566/_localstack/health | jq '.services.sqs' || echo "❌ LocalStack não está respondendo"
echo ""

echo "✅ Verificação completa!"
```

Salve como `check-services.sh` e execute: `bash check-services.sh`

---

## 🚀 Comandos Rápidos

```bash
# Iniciar tudo
docker compose up -d && cd backend && npm run start:dev

# Parar tudo
docker compose down

# Reiniciar tudo
docker compose restart

# Ver logs
docker compose logs -f

# Limpar tudo e recomeçar
docker compose down -v
docker compose up -d
cd backend && npm run start:dev
```

---

**Pronto! Agora você pode testar o sistema completo! 🎉**
