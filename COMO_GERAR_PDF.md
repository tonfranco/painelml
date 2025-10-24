# 📄 Como Gerar PDFs da Documentação

Guia rápido para gerar PDFs da documentação do Painel ML.

---

## 🚀 Uso Básico

### Gerar PDF da Semana Atual (Automático)

```bash
node generate-pdf.js
```

O script detecta automaticamente qual semana você está e gera o PDF correspondente.

---

## 📋 Comandos Disponíveis

### Semana 2

```bash
node generate-pdf.js 2
```

**Arquivos incluídos:**
- SUMARIO_SEMANA2.md
- ENTREGA_SEMANA2.md
- SEMANA2_IMPLEMENTADO.md
- EXEMPLOS_API.md
- ROADMAP_VISUAL.md
- CHECKLIST_VALIDACAO.md

**Resultado:** `docs-pdf/SEMANA2_COMPLETO.pdf`

---

### Semana 3

```bash
node generate-pdf.js 3
```

**Arquivos incluídos:**
- SUMARIO_SEMANA3.md
- ENTREGA_SEMANA3.md
- SEMANA3_IMPLEMENTADO.md
- EXEMPLOS_UI.md
- ROADMAP_VISUAL.md
- CHECKLIST_VALIDACAO.md

**Resultado:** `docs-pdf/SEMANA3_COMPLETO.pdf`

---

### Documentação Completa

```bash
node generate-pdf.js all
```

**Arquivos incluídos:**
- README_SEMANA2.md
- ROADMAP_VISUAL.md
- SUMARIO_SEMANA2.md
- ENTREGA_SEMANA2.md
- SEMANA2_IMPLEMENTADO.md
- EXEMPLOS_API.md
- CHECKLIST_VALIDACAO.md
- INDEX_DOCUMENTACAO.md

**Resultado:** `docs-pdf/COMPLETO_COMPLETO.pdf`

---

## 📂 Estrutura de Saída

```
painelML/
├── docs-pdf/
│   ├── SEMANA2_COMPLETO.md      # Markdown consolidado
│   ├── SEMANA2_COMPLETO.pdf     # PDF da Semana 2
│   ├── SEMANA3_COMPLETO.md      # Markdown consolidado
│   ├── SEMANA3_COMPLETO.pdf     # PDF da Semana 3
│   └── COMPLETO_COMPLETO.pdf    # PDF completo
└── generate-pdf.js
```

---

## 🔧 Configuração

### Adicionar Nova Semana

Edite `generate-pdf.js` e adicione na seção `DOCS_CONFIG`:

```javascript
const DOCS_CONFIG = {
  // ... semanas anteriores ...
  
  4: [
    'SUMARIO_SEMANA4.md',
    'ENTREGA_SEMANA4.md',
    'SEMANA4_IMPLEMENTADO.md',
    'EXEMPLOS_DEPLOY.md',
    'ROADMAP_VISUAL.md',
    'CHECKLIST_VALIDACAO.md',
  ],
};
```

### Personalizar Documentos

Para incluir/excluir documentos de uma semana, edite o array correspondente:

```javascript
2: [
  'SUMARIO_SEMANA2.md',
  'ENTREGA_SEMANA2.md',
  // Adicione ou remova arquivos aqui
],
```

---

## 🎯 Exemplos de Uso

### Workflow Típico

```bash
# 1. Completar implementação da semana
# ... desenvolvimento ...

# 2. Gerar documentação
# ... criar arquivos .md ...

# 3. Gerar PDF
node generate-pdf.js

# 4. Abrir PDF
open docs-pdf/SEMANA2_COMPLETO.pdf

# 5. Revisar e compartilhar
```

### Gerar Múltiplos PDFs

```bash
# Gerar PDF de cada semana
node generate-pdf.js 2
node generate-pdf.js 3

# Gerar PDF completo
node generate-pdf.js all
```

### Automatizar com Script

Crie `gerar-todos-pdfs.sh`:

```bash
#!/bin/bash

echo "📄 Gerando todos os PDFs..."

for week in 2 3; do
  echo "Gerando Semana $week..."
  node generate-pdf.js $week
done

echo "Gerando PDF completo..."
node generate-pdf.js all

echo "✅ Todos os PDFs gerados!"
ls -lh docs-pdf/*.pdf
```

Execute:

```bash
chmod +x gerar-todos-pdfs.sh
./gerar-todos-pdfs.sh
```

---

## 📊 Tamanhos Esperados

| PDF | Páginas (est.) | Tamanho (est.) |
|-----|----------------|----------------|
| Semana 2 | ~40-50 | ~200-300 KB |
| Semana 3 | ~40-50 | ~200-300 KB |
| Completo | ~80-100 | ~400-600 KB |

---

## ✅ Checklist

Antes de gerar o PDF:

- [ ] Todos os arquivos markdown estão criados
- [ ] Documentação está atualizada
- [ ] Exemplos de código estão corretos
- [ ] Não há erros de formatação

Após gerar o PDF:

- [ ] PDF foi criado em `docs-pdf/`
- [ ] Abrir e revisar conteúdo
- [ ] Verificar formatação
- [ ] Testar links (se houver)

---

## 🔍 Troubleshooting

### Erro: "Cannot find module"

```bash
# Instalar markdown-pdf
npm install -g markdown-pdf
```

### Arquivo não encontrado

Verifique se o arquivo existe:

```bash
ls -la SUMARIO_SEMANA2.md
```

Se não existir, crie-o antes de gerar o PDF.

### PDF vazio ou incompleto

Verifique os logs do script:

```bash
node generate-pdf.js 2 2>&1 | tee pdf-generation.log
```

### Personalizar estilo do PDF

O script usa `markdown-pdf` com configurações padrão. Para personalizar, você pode:

1. Usar Pandoc (mais opções de estilo)
2. Editar CSS do markdown-pdf
3. Pós-processar o PDF com ferramentas como `pdftk`

---

## 🎨 Dicas

### Melhorar Qualidade

- Use imagens em alta resolução
- Evite linhas muito longas de código
- Adicione quebras de página estratégicas
- Use títulos descritivos

### Otimizar Tamanho

- Comprima imagens antes
- Remova seções desnecessárias
- Use ferramentas de compressão de PDF

### Facilitar Leitura

- Adicione índice (TOC)
- Use hierarquia de títulos consistente
- Inclua exemplos práticos
- Adicione diagramas quando possível

---

## 📚 Recursos Adicionais

- **Markdown PDF:** https://github.com/alanshaw/markdown-pdf
- **Pandoc:** https://pandoc.org/
- **Markdown Guide:** https://www.markdownguide.org/

---

**Pronto para gerar PDFs de qualquer semana! 📄✨**
