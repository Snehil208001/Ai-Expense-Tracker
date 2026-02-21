# Deployment Options for AI Expense Tracker

All options for deploying the backend. Choose based on your needs.

---

## Free (No Credit Card)

| Platform | Notes | Guide |
|----------|------|-------|
| **Local + ngrok** | Run on your PC, expose via ngrok. 100% free. | [RUN_LOCAL_FOR_TESTING.md](RUN_LOCAL_FOR_TESTING.md) |
| **Render** | 750 hrs/mo free. Spins down after 15 min idle. Postgres expires in 90 days. | [DEPLOY_RENDER.md](DEPLOY_RENDER.md) |
| **Railway** | $5 free credit/mo. No card for trial. (We had 502 issues—may need debugging.) | [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) |
| **Back4app Containers** | Free tier: 256MB RAM, 600 hrs/mo. Docker + GitHub. No card. | See below |
| **Zeabur** | Free trial, then $5/mo credit. GitHub deploy. | zeabur.com |

---

## Free (Credit Card Required)

| Platform | Notes | Guide |
|----------|------|-------|
| **Fly.io** | Free tier. Requires card for verification. | [FLY_DEPLOY.md](FLY_DEPLOY.md) |
| **Google Cloud Run** | Free tier: 2M requests/mo. Requires GCP account. | - |
| **Oracle Cloud** | Always-free tier. Requires signup. | - |

---

## Paid (Low Cost)

| Platform | Notes |
|----------|-------|
| **Render** | From $7/mo for always-on |
| **Railway** | Pay as you go after $5 credit |
| **DigitalOcean App Platform** | From $5/mo |
| **Heroku** | From $5/mo (Eco dynos) |

---

## Back4app Containers (Free, No Card)

1. Go to **https://www.back4app.com**
2. Sign up (free)
3. Install **Back4app Containers** GitHub App
4. Create new project → **Containers**
5. Connect repo: `Snehil208001/Ai-Expense-Tracker`
6. **Root directory:** leave empty (uses root Dockerfile)
7. **Build:** Dockerfile
8. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`
9. For database: Use **Neon** (free) at neon.tech, or Back4app's DB if available
10. Deploy

---

## Self-Hosted (Your Server)

| Option | Notes |
|--------|-------|
| **Coolify** | Open-source PaaS. Deploy on your VPS/Raspberry Pi. coolify.io |
| **Docker Compose** | Run `docker-compose up` on any Linux server |
| **VPS** | Rent a $5/mo VPS (Hetzner, DigitalOcean, etc.) and run Docker |

---

## Quick Comparison

| Need | Best option |
|------|-------------|
| Test app now, zero cost | Local + ngrok |
| Free cloud, no card | Render or Back4app |
| Free cloud, have card | Fly.io |
| Production, low cost | Render $7/mo or Railway |
| Full control | VPS + Docker |
