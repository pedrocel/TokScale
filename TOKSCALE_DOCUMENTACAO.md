# TokScale — Documentação do Projeto

O **TokScale** é um micro-SaaS para gerenciar anúncios no TikTok em escala, com foco em automação de publicação em múltiplas contas e gerenciamento de tracking (Pixel).

## 1) Arquitetura

- **Frontend**: React (Vite) + TypeScript -> [Cloudflare Pages]
- **Backend**: Node.js/TypeScript -> [Cloudflare Workers]
- **Banco de Dados**: Cloudflare D1 (SQLite)
- **Fila/Jobs**: Cloudflare Queues
- **Auth**: Cookies seguro (httpOnly) ou JWT.

## 2) Estrutura do Repositório (Monorepo)

- `/apps/web`: Frontend React (Vite).
- `/apps/api`: Backend Cloudflare Workers.
- `/packages/shared`: Tipos e validações compartilhadas.

## 3) Status Atual (MVP - Fase 1)

- [x] Setup inicial do Frontend (Vite + React + TS).
- [x] Landing Page e Tela de Login básica.
- [ ] Configuração do Backend (Cloudflare Workers).
- [ ] Conexão com Banco de Dados (D1).
- [ ] Fluxo OAuth TikTok (Ads API).

## 4) Próximos Passos

1. Configurar o monorepo para separar `web` e `api`.
2. Inicializar o Cloudflare Worker para a API.
3. Definir o schema do banco de dados D1.
4. Implementar o endpoint de autenticação.
