# 📄 Como Gerar PDF da Documentação

Guia para gerar um PDF consolidado com toda a documentação da Semana 2.

---

## 🚀 Método 1: Script Automático (Recomendado)

### Passo 1: Instalar Dependências

```bash
# Instalar markdown-pdf globalmente
npm install -g markdown-pdf
```

### Passo 2: Executar Script

```bash
# Na raiz do projeto
node generate-pdf.js
```

### Passo 3: Abrir PDF

```bash
# O PDF será gerado em: docs-pdf/SEMANA2_COMPLETO.pdf
open docs-pdf/SEMANA2_COMPLETO.pdf
```

---

## 📦 Método 2: Pandoc (Alternativa)

### Passo 1: Instalar Pandoc

```bash
# macOS
brew install pandoc
brew install basictex  # LaTeX para PDF

# Ubuntu/Debian
sudo apt-get install pandoc texlive-xetex
```

### Passo 2: Gerar PDF

```bash
# Criar diretório
mkdir -p docs-pdf

# Combinar arquivos e gerar PDF
pandoc \
  SUMARIO_SEMANA2.md \
  ENTREGA_SEMANA2.md \
  SEMANA2_IMPLEMENTADO.md \
  EXEMPLOS_API.md \
  ROADMAP_VISUAL.md \
  CHECKLIST_VALIDACAO.md \
  -o docs-pdf/SEMANA2_COMPLETO.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=2 \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V documentclass=article \
  --highlight-style=tango
```

### Passo 3: Abrir PDF

```bash
open docs-pdf/SEMANA2_COMPLETO.pdf
```

---

## 🌐 Método 3: Markdown to PDF Online

### Opção A: Markdown PDF (Online)

1. Acesse: https://www.markdowntopdf.com/
2. Cole o conteúdo de cada arquivo markdown
3. Clique em "Convert to PDF"
4. Baixe o PDF

### Opção B: Dillinger

1. Acesse: https://dillinger.io/
2. Cole o conteúdo markdown
3. Clique em "Export as" → "PDF"
4. Baixe o PDF

---

## 🖨️ Método 4: Imprimir do Navegador

### Passo 1: Visualizar Markdown

```bash
# Instalar markdown viewer
npm install -g markdown-preview

# Visualizar arquivo
markdown-preview SUMARIO_SEMANA2.md
```

### Passo 2: Imprimir como PDF

1. Abrir no navegador
2. Pressionar `Cmd + P` (macOS) ou `Ctrl + P` (Windows/Linux)
3. Selecionar "Salvar como PDF"
4. Salvar arquivo

---

## 📋 Arquivos Incluídos no PDF

1. **SUMARIO_SEMANA2.md** (6 KB)
   - Resumo executivo
   - Métricas e estatísticas

2. **ENTREGA_SEMANA2.md** (8 KB)
   - Documento formal de entrega
   - Objetivos alcançados

3. **SEMANA2_IMPLEMENTADO.md** (8 KB)
   - Documentação técnica completa
   - Guias de implementação

4. **EXEMPLOS_API.md** (10 KB)
   - Exemplos práticos de uso
   - Scripts prontos

5. **ROADMAP_VISUAL.md** (6 KB)
   - Progresso visual
   - Timeline

6. **CHECKLIST_VALIDACAO.md** (8 KB)
   - Checklist completo
   - Critérios de validação

**Total:** ~46 KB de documentação

---

## 🎨 Personalização do PDF

### Adicionar Capa

Crie um arquivo `CAPA.md`:

```markdown
<div style="text-align: center; margin-top: 200px;">

# 📦 Painel ML
## Sistema de Gestão Mercado Livre

### Documentação Completa
### Semana 2

---

**Data:** Outubro 2025  
**Versão:** 2.0  
**Status:** Completo ✅

</div>

<div style="page-break-after: always;"></div>
```

E inclua no comando:

```bash
pandoc CAPA.md SUMARIO_SEMANA2.md ... -o PDF
```

### Adicionar Índice

```bash
pandoc ... --toc --toc-depth=3 -o PDF
```

### Mudar Estilo

```bash
pandoc ... \
  --highlight-style=breezedark \
  -V geometry:margin=0.75in \
  -V fontsize=10pt \
  -o PDF
```

---

## 🔧 Troubleshooting

### Erro: "markdown-pdf not found"

```bash
# Instalar globalmente
npm install -g markdown-pdf

# Ou usar npx
npx markdown-pdf arquivo.md
```

### Erro: "pandoc not found"

```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
# Baixar de: https://pandoc.org/installing.html
```

### Erro: "pdflatex not found"

```bash
# macOS
brew install basictex

# Ubuntu/Debian
sudo apt-get install texlive-xetex

# Windows
# Instalar MiKTeX: https://miktex.org/
```

### PDF com caracteres estranhos

Use `xelatex` em vez de `pdflatex`:

```bash
pandoc ... --pdf-engine=xelatex -o PDF
```

### PDF muito grande

Comprimir imagens antes ou usar:

```bash
# Reduzir qualidade
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output_compressed.pdf \
   input.pdf
```

---

## 📊 Resultado Esperado

### Estrutura do PDF

```
SEMANA2_COMPLETO.pdf
├─ Capa (opcional)
├─ Índice (opcional)
├─ Sumário Executivo
├─ Documento de Entrega
├─ Documentação Técnica
├─ Exemplos de API
├─ Roadmap Visual
└─ Checklist de Validação
```

### Tamanho Estimado

- **Páginas:** ~40-50 páginas
- **Tamanho:** ~500 KB - 2 MB
- **Formato:** A4 ou Letter

---

## 🎯 Comandos Rápidos

### Gerar PDF Simples

```bash
node generate-pdf.js
```

### Gerar PDF com Pandoc

```bash
pandoc SUMARIO_SEMANA2.md ENTREGA_SEMANA2.md SEMANA2_IMPLEMENTADO.md \
  EXEMPLOS_API.md ROADMAP_VISUAL.md CHECKLIST_VALIDACAO.md \
  -o docs-pdf/SEMANA2_COMPLETO.pdf --pdf-engine=xelatex
```

### Gerar PDF com Índice

```bash
pandoc *.md -o docs-pdf/SEMANA2_COMPLETO.pdf \
  --pdf-engine=xelatex --toc --toc-depth=2
```

### Abrir PDF

```bash
open docs-pdf/SEMANA2_COMPLETO.pdf
```

---

## ✅ Checklist

- [ ] Instalar dependências (markdown-pdf ou pandoc)
- [ ] Executar script de geração
- [ ] Verificar se PDF foi criado
- [ ] Abrir e validar conteúdo
- [ ] Verificar formatação
- [ ] Compartilhar se necessário

---

**Pronto! Agora você pode gerar PDFs da documentação facilmente! 📄✨**
