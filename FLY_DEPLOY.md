# Deploy to Fly.io

> **Note:** Fly.io now requires a payment method for new apps (free tier still available).  
> If you hit "We need your payment information", add a card at [fly.io/dashboard/.../billing](https://fly.io/dashboard) or use **Railway** instead (see DEPLOY_RAILWAY.md).

## Prerequisites

- [Fly.io account](https://fly.io/app/sign-up)
- [flyctl installed](https://fly.io/docs/hands-on/install-flyctl/)
- Payment method added (for new orgs)

---

## Step 1: Create Postgres

```bash
fly postgres create --name expense-tracker-db --region ord
```

When prompted, **don't** attach to an app yet. Note the connection string shown.

---

## Step 2: Create App & Set Secrets

```bash
cd backend
fly apps create expense-tracker-api
# Or skip if app already exists

fly secrets set DATABASE_URL="postgresql://..."   # From Step 1
fly secrets set JWT_SECRET="your-16-char-secret-minimum"
fly secrets set GOOGLE_GEMINI_API_KEY="your-gemini-key"   # Optional
```

---

## Step 3: Deploy

```bash
cd backend
fly deploy
```

---

## If Using GitHub Auto-Deploy

1. Fly.io Dashboard → Your App → **Settings**
2. **Source** → Connect GitHub repo
3. Set **Dockerfile path**: `backend/Dockerfile`
4. Set **Build context / Root directory**: `backend`
5. Set **Branch**: `main`

---

## Common Failures & Fixes

| Error | Fix |
|-------|-----|
| `DATABASE_URL` invalid | Run `fly secrets set DATABASE_URL="..."` with correct Postgres URL |
| `JWT_SECRET` too short | Use at least 16 characters |
| Build fails | Ensure `backend/Dockerfile` and `backend/fly.toml` exist |
| Port wrong | App listens on `PORT` env (Fly sets 8080) |
| Prisma migrate fails | Run from same region as Postgres; check DATABASE_URL format |

---

## Get Your URL

```bash
fly open
```

Or check Dashboard → your app → URL (e.g. `https://expense-tracker-api.fly.dev`)
