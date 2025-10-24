# 🔍 Debug OAuth Mercado Livre

## ❌ Erro: "Desculpe, não foi possível conectar o aplicativo à sua conta"

Este erro acontece quando há alguma inconsistência na configuração do OAuth.

---

## ✅ Checklist de Verificação

### 1. Verificar URLs no `.env.local`

Abra `backend/.env.local` e verifique:

```bash
# Deve ser EXATAMENTE a mesma URL em ambos
MELI_REDIRECT_URI="https://SUA-URL.trycloudflare.com/meli/oauth/callback"
APP_BASE_URL="https://SUA-URL.trycloudflare.com"
FRONTEND_BASE_URL="http://localhost:3000"
```

**Checklist:**
- [ ] URLs têm `https://` (não `http://`)
- [ ] URLs NÃO têm barra `/` no final
- [ ] `/meli/oauth/callback` está correto no REDIRECT_URI
- [ ] Mesma URL em MELI_REDIRECT_URI e APP_BASE_URL

---

### 2. Verificar Configuração no Mercado Livre

Acesse: https://developers.mercadolibre.com.br/apps

**Checklist:**
- [ ] Redirect URI no ML = MELI_REDIRECT_URI do .env.local
- [ ] Aplicação está em modo "Produção" (não "Teste")
- [ ] Client ID e Secret estão corretos
- [ ] Salvou as alterações no painel do ML

---

### 3. Verificar Túnel Cloudflare

```bash
# Ver se o túnel está rodando
ps aux | grep cloudflared

# Testar se o túnel está acessível
curl https://SUA-URL.trycloudflare.com
```

**Checklist:**
- [ ] Túnel está rodando
- [ ] URL responde (não dá erro DNS)
- [ ] Backend está rodando na porta 4000

---

### 4. Verificar Backend

```bash
# Testar endpoint OAuth
curl https://SUA-URL.trycloudflare.com/meli/oauth/start

# Deve redirecionar para o ML
```

**Checklist:**
- [ ] Backend foi reiniciado após mudar .env.local
- [ ] Backend está rodando sem erros
- [ ] Endpoint /meli/oauth/start responde

---

## 🔧 Soluções Comuns

### Problema 1: URLs Diferentes

**Sintoma:** Redirect URI no ML ≠ MELI_REDIRECT_URI no .env

**Solução:**
1. Copie a URL do túnel: `https://abc-def-ghi.trycloudflare.com`
2. Atualize `.env.local`:
   ```bash
   MELI_REDIRECT_URI="https://abc-def-ghi.trycloudflare.com/meli/oauth/callback"
   APP_BASE_URL="https://abc-def-ghi.trycloudflare.com"
   ```
3. Atualize no painel do ML (mesma URL)
4. Reinicie o backend

---

### Problema 2: Backend Não Reiniciado

**Sintoma:** Mudou .env.local mas backend não pegou as mudanças

**Solução:**
```bash
# Parar backend (Ctrl+C)
cd backend
npm run start:dev
```

---

### Problema 3: Túnel Caiu

**Sintoma:** URL do túnel não responde

**Solução:**
```bash
# Verificar se túnel está rodando
ps aux | grep cloudflared

# Se não estiver, iniciar novamente
cloudflared tunnel --url http://localhost:4000
```

---

### Problema 4: Client ID/Secret Errados

**Sintoma:** Erro mesmo com URLs corretas

**Solução:**
1. Acesse: https://developers.mercadolibre.com.br/apps
2. Copie Client ID e Client Secret
3. Atualize `.env.local`:
   ```bash
   MELI_CLIENT_ID="SEU_CLIENT_ID"
   MELI_CLIENT_SECRET="SEU_CLIENT_SECRET"
   ```
4. Reinicie backend

---

### Problema 5: Aplicação em Modo Teste

**Sintoma:** OAuth não funciona para outras contas

**Solução:**
1. No painel do ML, vá em "Configurações"
2. Mude de "Teste" para "Produção"
3. Aceite os termos
4. Salve

---

## 🧪 Teste Completo

Execute este script para testar tudo:

```bash
#!/bin/bash

echo "🔍 Verificando configuração OAuth..."
echo ""

# 1. Verificar .env.local
echo "📄 Verificando .env.local:"
cd backend
grep -E "(MELI_|APP_BASE)" .env.local
echo ""

# 2. Verificar túnel
echo "🌐 Verificando túnel Cloudflare:"
ps aux | grep cloudflared | grep -v grep
echo ""

# 3. Verificar backend
echo "🔧 Verificando backend:"
curl -s http://localhost:4000 && echo "✅ Backend respondendo" || echo "❌ Backend não responde"
echo ""

# 4. Extrair URL do túnel
TUNNEL_URL=$(grep "APP_BASE_URL" .env.local | cut -d'"' -f2)
echo "🔗 URL do túnel: $TUNNEL_URL"
echo ""

# 5. Testar túnel
echo "🧪 Testando túnel:"
curl -I "$TUNNEL_URL" 2>&1 | head -5
echo ""

# 6. Testar endpoint OAuth
echo "🔐 Testando endpoint OAuth:"
curl -I "$TUNNEL_URL/meli/oauth/start" 2>&1 | head -5
echo ""

echo "✅ Verificação completa!"
```

Salve como `check-oauth.sh` e execute: `bash check-oauth.sh`

---

## 📋 Template Correto do .env.local

```bash
# Database
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml?schema=public"

# Encryption
ENCRYPTION_KEY="669b6ec3b9bcce0061a18ac3cf5e805d65c23559d9982f6cb8fc2ff9871a2670"

# Mercado Livre OAuth
MELI_CLIENT_ID="8780271440058520"
MELI_CLIENT_SECRET="5SZaA9RU5d33iFVU2tCIBdatIJO3qOKv"
MELI_REDIRECT_URI="https://SUA-URL-AQUI.trycloudflare.com/meli/oauth/callback"

# App URLs
APP_BASE_URL="https://SUA-URL-AQUI.trycloudflare.com"
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

**Substitua `SUA-URL-AQUI` pela URL real do túnel!**

---

## 🎯 Fluxo Correto

1. **Iniciar túnel:**
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
   Copiar URL: `https://abc-def.trycloudflare.com`

2. **Atualizar .env.local:**
   ```bash
   MELI_REDIRECT_URI="https://abc-def.trycloudflare.com/meli/oauth/callback"
   APP_BASE_URL="https://abc-def.trycloudflare.com"
   ```

3. **Atualizar no ML:**
   - Ir em https://developers.mercadolibre.com.br/apps
   - Redirect URI: `https://abc-def.trycloudflare.com/meli/oauth/callback`
   - Salvar

4. **Reiniciar backend:**
   ```bash
   # Ctrl+C no terminal do backend
   npm run start:dev
   ```

5. **Testar:**
   - Abrir http://localhost:3000
   - Clicar em "Conectar Conta"
   - Deve funcionar!

---

## 🐛 Logs para Debug

Se ainda não funcionar, verifique os logs:

### Backend
```bash
# Ver logs do backend
# Procurar por erros relacionados a OAuth
```

### Túnel
```bash
# Ver logs do túnel
# Procurar por requisições chegando
```

### Browser
```bash
# Abrir DevTools (F12)
# Aba Network
# Ver requisições para /meli/oauth/*
```

---

## 📞 Informações Úteis

**Painel do ML:** https://developers.mercadolibre.com.br/apps

**Documentação OAuth:** https://developers.mercadolibre.com.br/pt_br/autenticacao-e-autorizacao

**Scopes necessários:**
- offline_access
- read
- write

---

**Siga este checklist e me diga qual item está falhando!**
