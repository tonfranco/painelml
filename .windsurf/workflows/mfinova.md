---
description: Estrutura e arquitetura - Sistema de Gestão Mercado Livre
auto_execution_mode: 1
---


Passo a passo (do zero ao produção)
1) Alinhar escopo
Perfis de usuário, KPIs (GMV, ticket médio, fill rate, SLA, giro), módulos (catálogo, pedidos, perguntas, logística, financeiro), volumes esperados, SLA e orçamento.
2) Criar app no Mercado Livre
Registrar app para obter client_id/client_secret.
Definir redirect_uri e ambientes (dev/stage/prod).
Ativar notificações/webhooks (orders, items, questions, shipments, claims).
3) Stack e projeto
Monorepo com frontend, backend, workers, infra como código.
Padronizar lint, formatação, commit, versionamento e ambientes.
4) Autenticação Mercado Livre (OAuth2 + PKCE)
Fluxo de consentimento, armazenamento seguro dos tokens, refresh automático, rotação e revogação.
Multi-conta (se necessário).
5) Modelagem de dados
Entidades: accounts, items, variations, prices, inventory, orders, order_items, payments, shipments, questions, messages, customers, audit_logs.
Índices e chaves idempotentes (ex.: meli_order_id, meli_item_id).
6) Ingestão inicial e sync incremental
Backfill controlado por janelas de tempo (desde a data X).
Incremental via updated_since + webhooks para eventos.
Governança de limites: rate limit, retry exponencial, circuit breaker.
7) Webhooks e processamento assíncrono
Receber eventos (orders_v2, items, questions, shipments).
Enfileirar jobs para normalizar e persistir.
Idempotência por event_id/resource_id.
8) Módulos de UI e API
Catálogo: CRUD assistido, variações, estoque, preço.
Pedidos: picking/packing, status, etiquetas.
Perguntas/mensagens: caixa única, templates, SLA.
Logística: rastreio, exceções, SLA.
Financeiro: pagamentos, conciliação básica.
RBAC/SSO e auditoria.
9) Dashboards e relatórios
KPI de vendas, funil, coortes, SLA de atendimento e expedição, ruptura de estoque.
Exportações (CSV/Excel) e agendamentos.
10) Observabilidade e segurança
Logs estruturados, métricas (latência, throughput, erros), tracing distribuído.
Auditoria de ações e acessos.
Backups, restauração testada, alertas 24/7.
11) CI/CD e deploy
Pipelines com testes unitários/integrados, scans de segurança, migrations.
Blue/green ou canary, feature flags e plano de rollback.
12) Testes e hardening
Unitários, integração com sandbox ML, E2E da UI, testes de carga.
Pentest/DAST, SAST/Dependabot.
Arquitetura recomendada
Frontend: Next.js (React + TypeScript), autenticação com SSO (ex.: Auth0/Azure AD/OIDC).
Backend: Node.js com NestJS (TypeScript) ou Python FastAPI. REST/GraphQL. Validação forte de schemas.
Banco: PostgreSQL (OLTP). Para BI, camada analítica (BigQuery/Redshift) opcional.
Cache: Redis (tokens, sessões, rate limit).
Fila/Workers: RabbitMQ ou SQS + workers para sync/webhooks/processamento pesado.
Armazenamento: S3/GCS para anexos/exports.
Infra: Docker. Orquestração com Kubernetes (EKS/GKE) ou ECS. IaC com Terraform.
Observabilidade: OpenTelemetry + Prometheus/Grafana, ELK/Datadog.
Segredos: AWS Secrets Manager/SSM, KMS para chaves.
CDN/WAF: CloudFront/Cloudflare + WAF + rate limiting.

Segurança e confiabilidade (pontos críticos)
OAuth2 + PKCE: guardar access_token/refresh_token cifrados; não expor no cliente.
Menor privilégio: RBAC granular, políticas de rede (SG/NACL), IAM mínimo necessário.
Proteção de dados: criptografia at-rest e in-transit (TLS 1.2+), PII tokenizada quando possível.
Hardening: WAF, CSP, HSTS, rate limiting, proteção CSRF/XSS/SSRF, validação de payloads.
Idempotência: chaves idempotentes em webhooks e jobs.
Resiliência: retries com jitter, circuit breaker, timeouts; dead-letter queue.
Backups & DR: backups automáticos, testes de restore, multi-AZ, RPO/RTO definidos.
Observabilidade: rastreabilidade por correlation_id; alarmes pró-ativos.
Compliance: LGPD (bases legais, consentimento, retenção, direito de exclusão).
Fases e prazo estimado (referência)
Fase 1 (1–2 semanas): App ML, OAuth, skeleton do projeto, RBAC básico.
Fase 2 (2–4 semanas): Modelagem, ingestão inicial e incremental, webhooks, módulos núcleo (catálogo, pedidos).
Fase 3 (2–3 semanas): Perguntas/mensagens, logística, relatórios e dashboards iniciais.
Fase 4 (1–2 semanas): Observabilidade, endurecimento de segurança, testes de carga, CI/CD e go-live.
Total inicial: 6–10 semanas (varia com escopo e integrações).
Próximos passos (confirmações rápidas)
[escopo] Vendedores únicos ou multi-conta ML?
[volumes] Itens ativos, pedidos/dia, usuários simultâneos?
[módulos] Precisa de financeiro (conciliação com Mercado Pago) nesta fase?
[infra] Preferência por AWS/GCP/Azure?
[SSO] Já utiliza algum IdP (Google Workspace, Azure AD, Auth0)?
[BI] Precisa de data warehouse e dashboards avançados desde o início?
Assim que você confirmar esses pontos, eu já provisiono o esqueleto do projeto e implemento o OAuth com o ML.
Status
Planejamento criado e TODOs iniciais organizados.
Aguardando suas respostas para iniciar a implementação.

Direcionadores confirmados
Multi-conta ML: suportaremos vincular várias contas do Mercado Livre por usuário/empresa.
Sem módulo financeiro agora: Mercado Pago fica para fase posterior.
AWS: foco em serviços gerenciados (RDS, SQS, ElastiCache, S3, CloudFront/WAF, Secrets).
Sem IdP atual: começamos com AWS Cognito (e deixamos pronto para integrar IdP OIDC/SAML depois).
Sem DWH no início: dashboards operacionais direto do OLTP + cache.
Arquitetura sugerida (AWS, segura e resiliente)
Frontend: Next.js (TypeScript) hospedado em S3 + CloudFront + WAF. Auth via Cognito Hosted UI.
Backend API: NestJS (Node/TS) rodando em ECS Fargate atrás de ALB. Schemas com zod/class-validator. Rate limiting e JWT com Cognito.
Webhooks ML: endpoint dedicado no ALB; enfileira eventos na SQS. Idempotência por event_id/resource.
Workers: serviços ECS Fargate consumindo SQS para processamento assíncrono (sync incremental, normalização).
Banco: RDS PostgreSQL (Multi-AZ). Migrações com Prisma ou TypeORM.
Cache: ElastiCache Redis (sessões, rate limit com ML, caches de consulta).
Storage: S3 para anexos/exports. KMS habilitado.
Segredos: AWS Secrets Manager (client_id/secret do ML, chaves JWT, DSN).
Observabilidade: CloudWatch + OpenTelemetry + métricas custom. Logs estruturados com correlation_id.
Infra: Terraform (pastas por ambiente envs/dev|stage|prod).
CI/CD: GitHub Actions com build, testes, scans, migrações, deploy canário/blue-green.
Modelagem e multi-tenancy
accounts: metadados por conta ML (nickname, site_id, seller_id).
account_tokens: access_token/refresh_token por conta, criptografados, com scope, expires_at, rotations.
users + user_accounts: RBAC e vínculo de usuários internos a contas ML.
Domínio: items, variations, inventories, orders, order_items, payments (placeholder), shipments, questions, messages, customers, audit_logs.
Chaves idempotentes: meli_*_id únicos; dedupe de webhook por event_id.
Fluxos-chave
Vincular nova conta ML: usuário clica “Conectar conta” → OAuth2 PKCE → salva tokens no account_tokens → inicia backfill por janelas + habilita webhooks.
Sincronização:
Backfill inicial controlado por janelas de tempo e paginação.
Incremental: jobs agendados (último updated_since) + webhooks para near-real-time.
Resiliência: retry exponencial com jitter, DLQ, circuit-breaker por rota ML.
Segurança:
Tokens sempre no servidor, cifrados (KMS). Nunca no client.
WAF, TLS, CSP, HSTS, CSRF na UI, validação forte de payloads.
Privilégio mínimo em IAM, SGs restritas, RBAC granular.
Backups automáticos e testes de restore.
Passo a passo objetivo (próximas 2–3 semanas)
Semana 1
Criar App no Mercado Livre: obter client_id/client_secret, definir redirect_uri, registrar webhooks.
Provisionar esqueleto: monorepo, NestJS API, Next.js UI, Terraform base, pipelines CI.
Cognito: user pool, domínio hosted UI, grupos/roles.
OAuth ML (PKCE): fluxo completo + armazenamento seguro dos tokens multi-conta.
Semana 2
Modelagem Postgres e migrações.
Ingestão inicial de items, orders, shipments, questions.
SQS + Workers para processamento assíncrono.
Webhooks: consumindo e orquestrando incremental.
Semana 3
UI: catálogo, pedidos e perguntas MVP.
Dashboards operacionais: vendas/dia, SLA perguntas, rupturas, backlog.
Observabilidade e hardening (WAF, rate limiting, auditoria).
O que preciso de você agora
Números de volume:
Quantos itens ativos?
Pedidos médios por dia (picos)?
Usuários simultâneos esperados?
AWS
Região preferida (ex.: sa-east-1 São Paulo).
Nome do domínio para produção (ex.: minhaempresa.com.br) e subdomínio para app (ex.: painel.m…), se houver.
Mercado Livre Developer App
Podemos começar com redirect_uri de DEV: https://localhost:3000/api/auth/meli/callback e depois trocar para prod? Se sim, confirmo a URL.
Assim que criar o app, guardaremos client_id/client_secret no Secrets Manager (nunca em código).
Entregáveis imediatos ao aprovar
Repo inicial com:
frontend/ Next.js + login Cognito + botão “Conectar conta ML”.
backend/ NestJS com endpoints auth/meli, webhooks/meli, accounts, items, orders, questions.
infra/terraform/ com módulos VPC, RDS, SQS, ElastiCache, Cognito, ALB, ECS, S3, CloudFront/WAF, Secrets.
CI/CD GitHub Actions.
Manual curto: como registrar o app ML na sandbox e apontar webhooks para DEV.
Próximos passos
Confirme volumes e região AWS.
Autorize que eu gere o esqueleto do projeto na sua workspace local. Eu não criarei nada sem sua confirmação.
Se preferir, posso primeiro te guiar pela criação do app no Mercado Livre e coletar client_id/secret com segurança.
Status
Plano ajustado para multi-conta na AWS com Cognito.
TODOs atualizados: em andamento a etapa de app ML.
Aguardando suas confirmações para iniciar o provisionamento do projeto e implementação do OAuth.

