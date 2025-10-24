#!/bin/bash

# Script para iniciar todo o sistema Painel ML
# Uso: ./start-all.sh

set -e

echo "🚀 Iniciando Painel ML..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se um serviço está rodando
check_service() {
  local name=$1
  local url=$2
  
  if curl -s "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $name está rodando${NC}"
    return 0
  else
    echo -e "${RED}❌ $name não está respondendo${NC}"
    return 1
  fi
}

# 1. Verificar Docker
echo -e "${BLUE}📦 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker não está rodando. Inicie o Docker Desktop primeiro.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# 2. Iniciar Docker Compose
echo -e "${BLUE}🐳 Iniciando containers (Postgres + LocalStack)...${NC}"
docker compose up -d

# Aguardar containers iniciarem
echo -e "${YELLOW}⏳ Aguardando containers iniciarem (30s)...${NC}"
sleep 30

# Verificar containers
echo ""
echo -e "${BLUE}📋 Status dos containers:${NC}"
docker compose ps
echo ""

# 3. Verificar Postgres
echo -e "${BLUE}🗄️  Verificando Postgres...${NC}"
if docker exec painelml-postgres pg_isready -U painelml > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Postgres está pronto${NC}"
else
  echo -e "${RED}❌ Postgres não está pronto${NC}"
  exit 1
fi
echo ""

# 4. Verificar LocalStack
echo -e "${BLUE}☁️  Verificando LocalStack...${NC}"
if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ LocalStack está pronto${NC}"
else
  echo -e "${YELLOW}⚠️  LocalStack ainda está inicializando...${NC}"
  echo -e "${YELLOW}   Aguarde mais 30 segundos antes de iniciar o backend${NC}"
fi
echo ""

# 5. Instruções para iniciar Backend
echo -e "${BLUE}🔧 Para iniciar o Backend:${NC}"
echo -e "   ${YELLOW}cd backend && npm run start:dev${NC}"
echo ""

# 6. Instruções para iniciar Frontend
echo -e "${BLUE}🎨 Para iniciar o Frontend:${NC}"
echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
echo ""

# 7. URLs
echo -e "${GREEN}📍 URLs:${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:4000${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo ""

echo -e "${GREEN}✅ Containers iniciados com sucesso!${NC}"
echo ""
echo -e "${YELLOW}💡 Dica: Abra 2 terminais e execute os comandos acima${NC}"
