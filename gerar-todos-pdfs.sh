#!/bin/bash

# Script para gerar todos os PDFs de documentação
# Uso: ./gerar-todos-pdfs.sh

set -e  # Parar em caso de erro

echo "📄 Gerando todos os PDFs da documentação"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para gerar PDF de uma semana
gerar_pdf_semana() {
  local semana=$1
  
  echo -e "${BLUE}📦 Gerando PDF da Semana ${semana}...${NC}"
  
  if node generate-pdf.js "$semana"; then
    echo -e "${GREEN}✅ Semana ${semana} concluída${NC}"
    echo ""
  else
    echo -e "${YELLOW}⚠️  Semana ${semana} não disponível ou erro${NC}"
    echo ""
  fi
}

# Detectar quais semanas existem
SEMANAS_DISPONIVEIS=()

if [ -f "SEMANA1_IMPLEMENTADO.md" ]; then
  SEMANAS_DISPONIVEIS+=(1)
fi

if [ -f "SEMANA2_IMPLEMENTADO.md" ]; then
  SEMANAS_DISPONIVEIS+=(2)
fi

if [ -f "SEMANA3_IMPLEMENTADO.md" ]; then
  SEMANAS_DISPONIVEIS+=(3)
fi

if [ -f "SEMANA4_IMPLEMENTADO.md" ]; then
  SEMANAS_DISPONIVEIS+=(4)
fi

# Verificar se há semanas disponíveis
if [ ${#SEMANAS_DISPONIVEIS[@]} -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Nenhuma documentação de semana encontrada${NC}"
  exit 1
fi

echo "Semanas disponíveis: ${SEMANAS_DISPONIVEIS[@]}"
echo ""

# Gerar PDF de cada semana
for semana in "${SEMANAS_DISPONIVEIS[@]}"; do
  gerar_pdf_semana "$semana"
done

# Gerar PDF completo
echo -e "${BLUE}📚 Gerando PDF completo...${NC}"
if node generate-pdf.js all; then
  echo -e "${GREEN}✅ PDF completo gerado${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  Erro ao gerar PDF completo${NC}"
  echo ""
fi

# Listar PDFs gerados
echo "========================================"
echo -e "${GREEN}✅ PDFs gerados com sucesso!${NC}"
echo ""
echo "Arquivos criados:"
ls -lh docs-pdf/*.pdf 2>/dev/null | awk '{print "  📄 " $9 " (" $5 ")"}'

echo ""
echo "Para abrir todos os PDFs:"
echo "  open docs-pdf/*.pdf"
echo ""
