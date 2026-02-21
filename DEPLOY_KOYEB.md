# Deploy to Koyeb (Free Tier, No Card Required)

Koyeb offers a free tier with 1 web service. No credit card required.

## Steps

### 1. Create Account
- Go to [koyeb.com](https://www.koyeb.com) → Sign up (GitHub)

### 2. Create PostgreSQL
- **Create** → **Database** → **PostgreSQL**
- Name: `expense-tracker-db`
- Region: Choose closest
- Create

### 3. Create Web Service
- **Create** → **Web Service**
- **Source:** GitHub → `Snehil208001/Ai-Expense-Tracker`
- **Branch:** main
- **Build**: Dockerfile
- **Dockerfile path:** `Dockerfile` (root) OR set **Root directory** to `backend` and use `Dockerfile`
- **Port:** 3000 (or leave default)
- **Instance type:** Free

### 4. Add Variables
- **DATABASE_URL:** Copy from your PostgreSQL service
- **JWT_SECRET:** 16+ chars
- **GOOGLE_GEMINI_API_KEY:** (optional)
- **PORT:** 3000

### 5. Deploy
- Click **Deploy**
- Copy the public URL (e.g. `https://your-app.koyeb.app`)

### 6. Update Mobile
In `mobile-expo/src/config/api.ts`:
```typescript
const PROD_API = 'https://your-app.koyeb.app';
```
