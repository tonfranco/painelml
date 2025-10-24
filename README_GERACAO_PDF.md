# 📄 Sistema de Geração de PDFs - Guia Rápido

Sistema automatizado para gerar PDFs da documentação do Painel ML.

---

## 🚀 Uso Rápido

### Gerar PDF da Semana Atual

```bash
node generate-pdf.js
```

### Gerar PDF de Semana Específica

```bash
node generate-pdf.js 2    # Semana 2
node generate-pdf.js 3    # Semana 3
```

### Gerar Todos os PDFs

```bash
./gerar-todos-pdfs.sh
```

---

## 📁 Arquivos do Sistema

### Scripts

1. **generate-pdf.js** - Script principal
   - Detecta semana automaticamente
   - Gera PDF de semana específica
   - Configurável para novas semanas

2. **gerar-todos-pdfs.sh** - Script auxiliar
   - Gera PDFs de todas as semanas
   - Detecta automaticamente semanas disponíveis
   - Gera também PDF completo

### Documentação

3. **COMO_GERAR_PDF.md** - Guia completo
   - Instruções detalhadas
   - Exemplos de uso
   - Troubleshooting

4. **README_GERACAO_PDF.md** - Este arquivo
   - Guia rápido
   - Referência rápida

---

## 🔧 Configuração

### Primeira Vez

```bash
# Instalar dependência
npm install -g markdown-pdf

# Dar permissão ao script bash
chmod +x gerar-todos-pdfs.sh

# Testar
node generate-pdf.js
```

### Adicionar Nova Semana

Edite `generate-pdf.js` na seção `DOCS_CONFIG`:

```javascript
const DOCS_CONFIG = {
  // ... semanas anteriores ...
  
  4: [
    'SUMARIO_SEMANA4.md',
    'ENTREGA_SEMANA4.md',
    'SEMANA4_IMPLEMENTADO.md',
    // ... outros arquivos ...
  ],
};
```

---

## 📊 Saída

### Estrutura

```
docs-pdf/
├── SEMANA2_COMPLETO.md       # Markdown consolidado
├── SEMANA2_COMPLETO.pdf      # PDF da Semana 2
├── SEMANA3_COMPLETO.md       # Markdown consolidado
├── SEMANA3_COMPLETO.pdf      # PDF da Semana 3
└── COMPLETO_COMPLETO.pdf     # PDF completo
```

### Tamanhos Típicos

- **Semana 2:** ~230 KB, 40-50 páginas
- **Semana 3:** ~200-300 KB, 40-50 páginas
- **Completo:** ~400-600 KB, 80-100 páginas

---

## 🎯 Casos de Uso

### Workflow Semanal

```bash
# 1. Completar implementação
# ... desenvolvimento ...

# 2. Criar documentação
# ... escrever .md ...

# 3. Gerar PDF
node generate-pdf.js

# 4. Revisar
open docs-pdf/SEMANA2_COMPLETO.pdf
```

### Entrega Final

```bash
# Gerar todos os PDFs
./gerar-todos-pdfs.sh

# Listar arquivos
ls -lh docs-pdf/*.pdf

# Compartilhar
# Enviar arquivos da pasta docs-pdf/
```

### Apresentação

```bash
# Gerar PDF completo
node generate-pdf.js all

# Abrir
open docs-pdf/COMPLETO_COMPLETO.pdf
```

---

## ✅ Checklist

### Antes de Gerar

- [ ] Documentação está completa
- [ ] Arquivos .md estão salvos
- [ ] Não há erros de formatação
- [ ] Exemplos de código estão corretos

### Após Gerar

- [ ] PDF foi criado
- [ ] Abrir e revisar
- [ ] Verificar formatação
- [ ] Testar se está completo

---

## 🔍 Comandos Úteis

```bash
# Ver PDFs gerados
ls -lh docs-pdf/*.pdf

# Abrir todos os PDFs
open docs-pdf/*.pdf

# Abrir PDF específico
open docs-pdf/SEMANA2_COMPLETO.pdf

# Limpar PDFs antigos
rm -rf docs-pdf/

# Gerar novamente
node generate-pdf.js
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **COMO_GERAR_PDF.md** - Guia completo com troubleshooting
- **GERAR_PDF.md** - Métodos alternativos (Pandoc, online, etc)

---

## 🎉 Pronto!

O sistema está configurado e pronto para usar nas próximas semanas!

**Comandos principais:**
- `node generate-pdf.js` - Gera PDF da semana atual
- `node generate-pdf.js 3` - Gera PDF da Semana 3
- `./gerar-todos-pdfs.sh` - Gera todos os PDFs

---

**Última atualização:** 24 de Outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
