# SignageOS — Digital Signage Platform

Sistema completo de gerenciamento e exibição de mídia indoor para TVs, elevadores e ambientes comerciais.

---

## Estrutura do Projeto

```
signage/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modelagem do banco
│   └── src/
│       ├── server.js              # Entry point (Express + WebSocket)
│       ├── config/
│       │   └── database.js        # Prisma client singleton
│       ├── middleware/
│       │   ├── auth.js            # JWT middleware
│       │   └── errorHandler.js    # Handler global de erros
│       ├── routes/
│       │   ├── auth.js            # /api/auth
│       │   ├── companies.js       # /api/companies
│       │   ├── media.js           # /api/media (upload Cloudinary)
│       │   ├── playlists.js       # /api/playlists
│       │   ├── screens.js         # /api/screens
│       │   ├── player.js          # /api/player/:shareToken (público)
│       │   └── logs.js            # /api/logs
│       └── utils/
│           └── websocket.js       # Broadcast em tempo real
└── frontend/
    └── src/
        ├── App.jsx                # Roteamento principal
        ├── main.jsx               # Entry point React
        ├── index.css              # Tailwind + global styles
        ├── lib/
        │   └── api.js             # Axios com interceptor JWT
        ├── context/
        │   └── authStore.js       # Zustand auth store
        ├── components/
        │   └── layout/
        │       └── Layout.jsx     # Sidebar + header
        └── pages/
            ├── LoginPage.jsx      # Autenticação
            ├── DashboardPage.jsx  # Visão geral + métricas
            ├── ScreensPage.jsx    # Gestão de telas/TVs
            ├── PlaylistsPage.jsx  # Playlists + ordenação de itens
            ├── MediaPage.jsx      # Upload e biblioteca de mídias
            ├── CompaniesPage.jsx  # Empresas/anunciantes
            └── PlayerPage.jsx     # Player público (tela cheia para TVs)
```

---

## Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL (local ou Supabase)
- Conta gratuita no Cloudinary

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais

npm install

# Criar as tabelas no banco
npx prisma db push

# Iniciar em desenvolvimento
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001/api

npm install
npm run dev
```

Acesse: http://localhost:5173

### 3. Criar primeiro usuário

Use um cliente HTTP (Insomnia, curl) ou adapte o seed:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@email.com","password":"senha123","name":"Admin"}'
```

> No primeiro registro, não há autenticação exigida. Após isso, apenas usuários autenticados podem criar novos.

---

## Deploy Gratuito

### Banco de Dados — Supabase (gratuito)

1. Crie conta em https://supabase.com
2. Crie um projeto novo
3. Vá em Settings > Database > Connection string
4. Copie a URL no formato `postgresql://...` e coloque em `DATABASE_URL`

### Armazenamento de Mídia — Cloudinary (gratuito)

1. Crie conta em https://cloudinary.com
2. Copie Cloud Name, API Key e API Secret do dashboard
3. Configure as variáveis `CLOUDINARY_*` no .env do backend
4. Tier gratuito: 25GB de armazenamento + 25GB de banda/mês

### Backend — Render (gratuito)

1. Acesse https://render.com e crie uma conta
2. Clique em "New Web Service"
3. Conecte ao repositório Git
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Adicione as variáveis de ambiente (DATABASE_URL, JWT_SECRET, CLOUDINARY_*)
6. Deploy — você receberá uma URL como `https://seu-app.onrender.com`

> Atenção: no plano gratuito do Render, o serviço "dorme" após 15min sem requisições. Para produção, use o plano pago ($7/mês) ou Railway.

### Frontend — Vercel (gratuito)

1. Acesse https://vercel.com
2. Importe o repositório
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione variável de ambiente:
   - `VITE_API_URL` = `https://seu-backend.onrender.com/api`
5. Deploy — URL automática como `https://seu-app.vercel.app`

### Alternativa Backend — Railway

```bash
# Instale a CLI do Railway
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

Railway tem $5/mês de crédito gratuito e não "dorme" como o Render.

---

## Como Usar

### Fluxo básico

1. **Login** → entre com seu usuário no painel
2. **Empresa** → cadastre a empresa/anunciante em `/companies`
3. **Mídia** → faça upload de vídeos e imagens em `/media`
4. **Playlist** → crie uma playlist e adicione as mídias em `/playlists`
5. **Tela** → cadastre a TV em `/screens` e vincule a playlist
6. **Player** → copie o link da tela e abra no navegador da TV

### Configurar a TV

Na TV, abra o navegador e:
- Acesse o link copiado: `https://seu-app.vercel.app/player/TOKEN`
- Ative o kiosk mode (tela cheia sem interface do browser):
  - **Chrome/Chromium**: `--kiosk --start-fullscreen`
  - **TV Samsung/LG**: use o browser nativo em tela cheia
  - **Raspberry Pi**: `chromium-browser --kiosk URL`

O player:
- Executa em loop automático
- Atualiza o conteúdo via WebSocket sem recarregar a página
- Salva cache local para funcionar offline temporariamente
- Exibe indicadores de progresso (pontos) quando há múltiplos itens

---

## API — Principais Endpoints

```
POST   /api/auth/login              Login → retorna JWT
GET    /api/auth/me                 Dados do usuário logado

GET    /api/companies               Listar empresas
POST   /api/companies               Criar empresa

POST   /api/media/upload            Upload de mídia (multipart)
GET    /api/media?search=&type=     Listar mídias com filtros
DELETE /api/media/:id               Soft delete

GET    /api/playlists               Listar playlists
POST   /api/playlists               Criar playlist
POST   /api/playlists/:id/items     Adicionar mídia à playlist
PUT    /api/playlists/:id/items/reorder  Reordenar itens
DELETE /api/playlists/:id/items/:itemId  Remover item

GET    /api/screens                 Listar telas
POST   /api/screens                 Criar tela
POST   /api/screens/:id/playlists   Vincular playlist à tela
POST   /api/screens/:id/heartbeat   Atualizar status online

GET    /api/player/:shareToken      Conteúdo público da tela (sem auth)
```

---

## Melhorias Futuras

### Curto prazo
- [ ] Drag & drop para reordenar itens da playlist
- [ ] Agendamento visual (calendário por mídia)
- [ ] Preview em miniatura das telas no dashboard
- [ ] Upload direto para Supabase Storage (alternativa ao Cloudinary)

### Médio prazo
- [ ] Planos de assinatura (Stripe) — Basic/Pro/Enterprise
- [ ] Relatórios de exibição com gráficos
- [ ] App móvel para monitoramento
- [ ] Suporte a HTML/widget como tipo de mídia

### Longo prazo
- [ ] IA para sugestão de horários ideais por audiência
- [ ] Integração com Google Slides e Canva
- [ ] Multi-tenant completo com subdomínios por empresa
- [ ] Suporte a displays de LED e totens interativos

---

## Stack Utilizada

| Camada | Tecnologia | Plano gratuito |
|--------|-----------|---------------|
| Frontend | React + Vite + Tailwind | — |
| Deploy Frontend | Vercel | ✅ Gratuito |
| Backend | Node.js + Express | — |
| Deploy Backend | Render / Railway | ✅ Gratuito |
| Banco de dados | PostgreSQL via Supabase | ✅ 500MB gratuito |
| ORM | Prisma | — |
| Armazenamento | Cloudinary | ✅ 25GB gratuito |
| Auth | JWT (jsonwebtoken) | — |
| Tempo real | WebSocket nativo (ws) | — |
| Estado global | Zustand | — |
| Queries | TanStack Query | — |
