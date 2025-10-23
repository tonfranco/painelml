# Instalação do Docker (macOS)

## Opção 1: Docker Desktop (Recomendado)

1. Baixe: https://www.docker.com/products/docker-desktop/
2. Instale o .dmg
3. Abra Docker Desktop
4. Aguarde inicialização completa

## Opção 2: Homebrew

```bash
brew install --cask docker
```

## Verificar Instalação

```bash
docker --version
docker compose version
```

## Após Instalação

```bash
# Na raiz do projeto
docker compose up -d

# Verificar
docker ps
```

## Alternativa: PostgreSQL Local (sem Docker)

Se preferir não usar Docker:

```bash
# Instalar PostgreSQL
brew install postgresql@15

# Iniciar serviço
brew services start postgresql@15

# Criar banco
createdb painelml

# Criar usuário
psql postgres -c "CREATE USER painelml WITH PASSWORD 'dev_password_123';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE painelml TO painelml;"
```

Depois ajuste o `DATABASE_URL` no `.env.local`:
```
DATABASE_URL="postgresql://painelml:dev_password_123@localhost:5432/painelml?schema=public"
```
