# Deploy to Railway (Free $5 Credit)

Railway offers $5/month free credit—no credit card required for trial.

## Steps

### 1. Create Project

1. Go to [railway.app](https://railway.app) → **Login** (GitHub)
2. **New Project** → **Deploy from GitHub repo**
3. Select `Snehil208001/Ai-Expense-Tracker`
4. **Important:** Click the service → **Settings** → set **Root Directory** to `backend`
5. Click **Deploy**

### 2. Add PostgreSQL

1. In your project → **+ New** → **Database** → **PostgreSQL**
2. Railway creates the DB and sets `DATABASE_URL` automatically

### 3. Add Variables

1. Click your **backend service** → **Variables**
2. Add:
   - `JWT_SECRET` = any string 16+ chars (e.g. `my-super-secret-key-12345`)
   - `GOOGLE_GEMINI_API_KEY` = your [Gemini key](https://aistudio.google.com/apikey) (optional)

### 4. Build Settings (if build fails)

Railway uses the **Dockerfile** in `backend/` when Root Directory is set. If build fails:

- **Settings** → **Build** → ensure **Root Directory** = `backend`
- Or set **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npx prisma migrate deploy && node dist/index.js`

### 5. Deploy & Get URL

1. **Deploy** (or redeploy)
2. **Settings** → **Generate Domain** → copy URL (e.g. `https://expense-tracker-api-production.up.railway.app`)

### 6. Update Mobile App

In `mobile-expo/src/config/api.ts`:

```typescript
const PROD_API = 'https://your-app.up.railway.app';
```
