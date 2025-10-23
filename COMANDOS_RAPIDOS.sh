#!/bin/bash
# Comandos Rápidos - Painel ML
# Copie e cole os comandos que precisar

# ========================================
# SETUP INICIAL
# ========================================

# 1. Subir PostgreSQL
docker compose up -d

# 2. Verificar se PostgreSQL está rodando
docker ps | grep painelml-postgres

# 3. Ver logs do PostgreSQL
docker logs painelml-postgres

# ========================================
# BACKEND - SETUP
# ========================================

cd backend

# Copiar .env
cp env.example .env.local

# Gerar chave de criptografia (copiar resultado para .env.local)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Instalar dependências
npm install

# Gerar Prisma Client
npm run prisma:generate

# Criar e rodar migrations
npm run prisma:migrate

# Iniciar backend (dev)
npm run start:dev

# ========================================
# BACKEND - PRISMA
# ========================================

# Abrir Prisma Studio (GUI do banco)
npm run prisma:studio

# Criar nova migration
npm run prisma:migrate

# Resetar banco (CUIDADO: apaga tudo!)
npm run db:reset

# Gerar client novamente
npm run prisma:generate

# ========================================
# BACKEND - TESTES
# ========================================

# Listar contas conectadas
curl http://localhost:4000/accounts

# Status de uma conta (substitua SELLER_ID)
curl http://localhost:4000/accounts/123456789/status

# Estatísticas de webhooks
curl http://localhost:4000/meli/webhooks/stats

# Eventos pendentes
curl http://localhost:4000/meli/webhooks/pending

# Listar itens
curl http://localhost:4000/items

# Estatísticas de itens
curl http://localhost:4000/items/stats

# Listar pedidos
curl http://localhost:4000/orders

# Estatísticas de pedidos
curl http://localhost:4000/orders/stats

# Iniciar sync (substitua ACCOUNT_ID)
curl -X POST http://localhost:4000/sync/start \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID", "scope": "all", "days": 30}'

# Ver status do sync
curl http://localhost:4000/sync/status/ACCOUNT_ID

# ========================================
# FRONTEND - SETUP
# ========================================

cd frontend

# Instalar dependências
npm install

# Iniciar frontend (dev)
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start

# ========================================
# DOCKER
# ========================================

# Subir todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Ver logs
docker logs painelml-postgres

# Ver logs em tempo real
docker logs -f painelml-postgres

# Reiniciar PostgreSQL
docker compose restart

# Entrar no container PostgreSQL
docker exec -it painelml-postgres psql -U painelml -d painelml

# ========================================
# ABRIR NO NAVEGADOR
# ========================================

# Home
open http://localhost:3000

# Contas
open http://localhost:3000/accounts

# Catálogo
open http://localhost:3000/catalog

# Pedidos
open http://localhost:3000/orders

# OAuth (conectar conta)
open http://localhost:4000/meli/oauth/start

# Prisma Studio
open http://localhost:5555

# ========================================
# CLOUDFLARE TUNNEL (se necessário)
# ========================================

# Instalar cloudflared
brew install cloudflare/cloudflare/cloudflared

# Iniciar túnel
cloudflared tunnel --url http://localhost:4000

# ========================================
# DESENVOLVIMENTO
# ========================================

# Backend: watch mode
cd backend && npm run start:dev

# Frontend: dev mode
cd frontend && npm run dev

# Ambos em terminais separados
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd frontend && npm run dev

# ========================================
# LIMPEZA / RESET
# ========================================

# Parar tudo
docker compose down

# Remover volumes (apaga banco)
docker compose down -v

# Subir novamente
docker compose up -d

# Resetar migrations
cd backend && npm run db:reset

# Rodar migrations novamente
npm run prisma:migrate

# ========================================
# TROUBLESHOOTING
# ========================================

# Verificar portas em uso
lsof -i :3000  # Frontend
lsof -i :4000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :5555  # Prisma Studio

# Matar processo na porta 4000
lsof -ti:4000 | xargs kill -9

# Verificar Docker
docker --version
docker compose version

# Verificar Node/NPM
node --version
npm --version

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Prisma
rm -rf node_modules/.prisma
npm run prisma:generate

# ========================================
# GIT (se estiver versionando)
# ========================================

# Inicializar repo
git init

# Adicionar tudo
git add .

# Commit
git commit -m "feat: fase 2 completa - oauth, webhooks, backfill, ui"

# Ver status
git status

# Ver diff
git diff

# ========================================
# PRODUÇÃO (exemplo com Railway)
# ========================================

# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Deploy
railway up

# Ver logs
railway logs

# ========================================
# BACKUP DO BANCO
# ========================================

# Exportar banco
docker exec painelml-postgres pg_dump -U painelml painelml > backup.sql

# Importar banco
docker exec -i painelml-postgres psql -U painelml painelml < backup.sql

# ========================================
# VARIÁVEIS DE AMBIENTE
# ========================================

# Gerar ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ver variáveis (backend)
cat backend/.env.local

# Editar variáveis
nano backend/.env.local
# ou
code backend/.env.local

# ========================================
# LOGS E DEBUG
# ========================================

# Backend logs
cd backend && npm run start:dev

# Ver logs do Docker
docker logs painelml-postgres

# Prisma Studio para debug visual
npm run prisma:studio

# ========================================
# TESTES RÁPIDOS
# ========================================

# Teste completo em sequência:

# 1. Subir banco
docker compose up -d

# 2. Setup backend
cd backend && npm install && npm run prisma:generate && npm run prisma:migrate

# 3. Iniciar backend (em outro terminal)
npm run start:dev

# 4. Setup frontend (em outro terminal)
cd frontend && npm install && npm run dev

# 5. Abrir navegador
open http://localhost:3000

# 6. Conectar conta ML
open http://localhost:4000/meli/oauth/start

# 7. Ver contas
curl http://localhost:4000/accounts

# 8. Iniciar sync (substitua ACCOUNT_ID)
curl -X POST http://localhost:4000/sync/start \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID", "scope": "all", "days": 30}'

# 9. Ver dados no frontend
open http://localhost:3000/catalog
open http://localhost:3000/orders

# ========================================
# FIM
# ========================================

echo "✅ Comandos carregados!"
echo "📚 Ver documentação completa em README.md"
echo "🚀 Quick start: QUICK_START.md"
echo "✅ Checklist: CHECKLIST_TESTES.md"
