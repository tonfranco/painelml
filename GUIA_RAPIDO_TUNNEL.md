# 🚀 Guia Rápido - Iniciar com Cloudflare Tunnel

## 🎯 Problema Resolvido

Antes você precisava:
1. ❌ Iniciar o túnel manualmente
2. ❌ Copiar a URL gerada
3. ❌ Atualizar o `.env.local` manualmente
4. ❌ Atualizar no painel do Mercado Livre
5. ❌ Reiniciar o backend

Agora você só precisa:
1. ✅ Rodar **um único script**
2. ✅ Atualizar no painel do ML (apenas isso!)

---

## 🚀 Como Usar

### 1. Iniciar Tudo de Uma Vez

```bash
# Na raiz do projeto
bash start-with-tunnel.sh
```

O script vai:
- ✅ Verificar e iniciar o Docker (se necessário)
- ✅ Iniciar o Cloudflare Tunnel
- ✅ Capturar a URL gerada automaticamente
- ✅ Atualizar o `backend/.env.local` com a URL nova
- ✅ Gerar o Prisma Client (se necessário)
- ✅ Mostrar a URL que você precisa configurar no ML
- ✅ Perguntar se quer iniciar o backend

**Saída esperada:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sistema configurado com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Informações importantes:

   🌐 URL do Túnel: https://abc-def-ghi.trycloudflare.com
   🔗 Redirect URI: https://abc-def-ghi.trycloudflare.com/meli/oauth/callback
   📝 PID do Túnel: 12345

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  AÇÃO NECESSÁRIA:

   1. Acesse: https://developers.mercadolibre.com.br/apps
   2. Selecione sua aplicação
   3. Atualize o Redirect URI para:

      https://abc-def-ghi.trycloudflare.com/meli/oauth/callback

   4. Salve as alterações
```

---

### 2. Atualizar no Mercado Livre

1. Acesse: https://developers.mercadolibre.com.br/apps
2. Selecione sua aplicação
3. Vá em **"Redirect URI"**
4. Cole a URL que o script mostrou
5. **Salve**

---

### 3. Iniciar Frontend (em outro terminal)

```bash
cd frontend
npm run dev
```

---

### 4. Acessar Aplicação

Abra: http://localhost:3000

Clique em **"Conectar Conta do Mercado Livre"** e pronto! 🎉

---

## 🛑 Parar Tudo

```bash
# Na raiz do projeto
bash stop-all.sh
```

O script vai parar:
- Cloudflare Tunnel
- Backend (NestJS)
- Frontend (Next.js)
- Docker (opcional)

---

## 🔄 Reiniciar (próxima vez)

**Toda vez que você iniciar o sistema:**

```bash
# 1. Rodar o script
bash start-with-tunnel.sh

# 2. Atualizar URL no painel do ML (copiar do output)

# 3. Iniciar frontend (outro terminal)
cd frontend && npm run dev
```

**Tempo total: ~30 segundos** ⚡

---

## 💡 Dicas

### Ver logs do túnel em tempo real

```bash
tail -f tunnel.log
```

### Ver qual URL está configurada

```bash
grep MELI_REDIRECT_URI backend/.env.local
```

### Parar apenas o túnel

```bash
# Se você salvou o PID
kill $(cat tunnel.pid)

# Ou matar todos os cloudflared
pkill -f cloudflared
```

### Verificar se tudo está rodando

```bash
# Túnel
ps aux | grep cloudflared

# Backend
curl http://localhost:4000

# Frontend
curl http://localhost:3000
```

---

## 🐛 Troubleshooting

### Erro: "cloudflared: command not found"

Instale o Cloudflare Tunnel:

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Erro: "Permission denied"

Torne o script executável:

```bash
chmod +x start-with-tunnel.sh
chmod +x stop-all.sh
```

### Túnel não gera URL

Aguarde mais alguns segundos e verifique o log:

```bash
cat tunnel.log
```

### Backend não inicia

Verifique se o Postgres está rodando:

```bash
docker compose ps
```

---

## 📋 Checklist de Inicialização

- [ ] Docker Desktop rodando
- [ ] Executar `bash start-with-tunnel.sh`
- [ ] Copiar URL do output
- [ ] Atualizar no painel do ML
- [ ] Iniciar frontend (`cd frontend && npm run dev`)
- [ ] Acessar http://localhost:3000
- [ ] Conectar conta do ML

---

## 🎯 Fluxo Visual

```
┌─────────────────────────────────────────┐
│  bash start-with-tunnel.sh              │
└─────────────────┬───────────────────────┘
                  │
                  ├─► 📦 Inicia Docker
                  ├─► 🌐 Inicia Cloudflare Tunnel
                  ├─► 📝 Atualiza .env.local
                  ├─► 🔧 Gera Prisma Client
                  └─► 📋 Mostra URL para configurar
                  
┌─────────────────────────────────────────┐
│  Você: Atualiza URL no painel do ML     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  cd frontend && npm run dev              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  ✅ Sistema funcionando!                 │
│  http://localhost:3000                   │
└──────────────────────────────────────────┘
```

---

## 🚀 Comandos Rápidos

```bash
# Iniciar tudo
bash start-with-tunnel.sh

# Parar tudo
bash stop-all.sh

# Ver logs do túnel
tail -f tunnel.log

# Ver URL configurada
grep MELI_REDIRECT_URI backend/.env.local

# Reiniciar apenas backend
cd backend && npm run start:dev

# Reiniciar apenas frontend
cd frontend && npm run dev
```

---

## 📚 Arquivos Relacionados

- `start-with-tunnel.sh` - Script principal de inicialização
- `stop-all.sh` - Script para parar todos os serviços
- `tunnel.log` - Logs do Cloudflare Tunnel
- `tunnel.pid` - PID do processo do túnel
- `backend/.env.local` - Configurações (atualizado automaticamente)

---

**Pronto! Agora você tem um fluxo muito mais simples! 🎉**

Qualquer dúvida, consulte este guia ou o `DEBUG_OAUTH_ML.md`.
