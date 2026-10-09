# PboxTV Monorepo

A full-stack streaming platform backed by Telegram CDN with a Go API server, Python Telegram bot sidecar, and a React frontend.

## 📁 Structure

```
pboxtv-monorepo/
├── apps/
│   └── web/                  # React + Vite frontend (deployed to Vercel)
├── services/
│   ├── api-server/           # Go (Gin) HTTP API + streaming proxy
│   └── telegram-bot/         # Python Pyrofork bot + MongoDB sidecar
├── docker-compose.yml        # Local development
├── railway.toml              # Railway deployment config
└── README.md
```

## 🚀 Services

| Service | Language | Port | Description |
|---|---|---|---|
| `api-server` | Go (Gin) | 8000 | REST API, streaming proxy, rate-limited CDN |
| `telegram-bot` | Python (Pyrofork) | 8001 | Telegram bot + internal chunk server |
| `web` | React/Vite | 3000 | Frontend UI (Vercel) |

## 🔧 Local Development

```bash
# Start all services
docker-compose up --build

# Frontend only
cd apps/web && npm install && npm run dev

# Go server only
cd services/api-server && go run .

# Python bot only
cd services/telegram-bot && pip install -r requirements.txt && python -m Backend
```

## ⚙️ Environment Variables

### `services/api-server/.env`
```env
PORT=8000
MONGO_URI=mongodb+srv://...
SIDECAR_URL=http://localhost:8001
CORS_ORIGINS=https://pboxtv.vercel.app,https://pboxtv.com
```

### `services/telegram-bot/config.env`
```env
API_ID=...
API_HASH=...
BOT_TOKEN=...
DATABASE=mongodb+srv://...
MULTI_TOKEN1=...
# ... etc
PORT=8001
BASE_URL=http://localhost:8000
```

### `apps/web/.env`
```env
VITE_BASE_URL=https://your-railway-app.up.railway.app
VITE_TG_USERNAME=Pboxtvstorebot
VITE_SITENAME=PboxTV
VITE_TG_URL=https://t.me/RagnarServers
```

## 📦 Deployment

- **Frontend**: Push to GitHub → auto-deploys on Vercel
- **Backend (Go + Python)**: Railway — uses `railway.toml` + `Dockerfile`

## 🤖 Telegram Bots

All 6 bots are preserved and configured via `MULTI_TOKEN1–5` + `BOT_TOKEN`. Do **not** remove or rotate these without restarting the sidecar.
