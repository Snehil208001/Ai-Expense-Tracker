# AI Expense Tracker

A full-stack expense tracking app with AI-powered receipt scanning, natural language expense entry, and spending insights. Built with Node.js, React Native (Expo), and Google Gemini.

## Features

- **Receipt scanning** – Scan receipts with your camera; AI extracts amount, merchant, and date
- **Natural language** – Add expenses by typing "Coffee $5 yesterday"
- **Categories** – Organize expenses with custom categories
- **Analytics** – Monthly reports, spending by category, anomaly alerts
- **AI chat** – Ask questions about your spending
- **Dark mode** – Toggle theme in Profile
- **Multi-tenant** – Sign up creates your own workspace

## Project Structure

```
├── backend/          # Node.js + Fastify + Prisma API
├── mobile-expo/      # React Native (Expo) mobile app
├── render.yaml       # Render.com deployment blueprint
└── DEPLOY_RENDER.md  # Deployment instructions
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit with your DATABASE_URL, JWT_SECRET, GOOGLE_GEMINI_API_KEY
npm run db:migrate
npm run dev
```

Runs at `http://localhost:3000`

### Mobile App

```bash
cd mobile-expo
npm install
```

Edit `src/config/api.ts` – set `DEV_HOST` to your machine's IP (e.g. `192.168.1.8`) for physical device testing.

```bash
npx expo start
```

## Deploy to Render

Deploy the backend to [Render](https://render.com) for always-on API access:

1. Push this repo to GitHub
2. Go to [Render Blueprints](https://dashboard.render.com/blueprints)
3. New Blueprint → Connect `Snehil208001/Ai-Expense-Tracker`
4. Apply (creates PostgreSQL + Web Service)
5. Add `GOOGLE_GEMINI_API_KEY` in Environment
6. Update `mobile-expo/src/config/api.ts` with your Render URL

See [DEPLOY_RENDER.md](DEPLOY_RENDER.md) for details.

## Tech Stack

| Layer    | Stack                          |
|----------|--------------------------------|
| Backend  | Node.js, Fastify, Prisma, PostgreSQL |
| AI       | Google Gemini                  |
| Mobile   | React Native, Expo             |
| Auth     | JWT                            |

## API Overview

- **Auth**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`
- **Expenses**: CRUD at `/api/expenses`, summary at `/api/expenses/summary`
- **Categories**: CRUD at `/api/categories`
- **AI**: Receipt parse, insights, chat, report, anomalies

See [backend/README.md](backend/README.md) for full API docs.

## License

MIT
