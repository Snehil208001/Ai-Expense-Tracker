# Deploy Backend – Step-by-Step (Koyeb – No Card Required)

Railway has been giving 502 errors. Use **Koyeb** instead – free tier, no credit card.

---

## Step 1: Create Koyeb Account

1. Open **https://www.koyeb.com**
2. Click **Get started**
3. Sign up with **GitHub**
4. Authorize Koyeb

---

## Step 2: Create PostgreSQL Database

1. In Koyeb dashboard, click **Create** → **Database**
2. Choose **PostgreSQL**
3. **Name:** `expense-tracker-db`
4. **Region:** Choose closest (e.g. `Washington` or `Frankfurt`)
5. Click **Deploy**
6. Wait until status is **Running**
7. Open the database → **Overview** tab
8. Copy the **Connection string** (starts with `postgresql://`) – you’ll need it in Step 4

---

## Step 3: Create Web Service

1. Click **Create** → **Web Service**
2. **Deployment method:** GitHub
3. Connect GitHub if needed → select **Snehil208001/Ai-Expense-Tracker**
4. **Branch:** `main`
5. **Build and deploy:**
   - **Builder:** Dockerfile
   - **Dockerfile path:** `Dockerfile` (leave default)
   - **Root directory:** leave **empty** (uses repo root)
6. **Instance type:** Free
7. **Port:** `3000` (important)
8. Click **Advanced** or scroll down to **Environment variables**

---

## Step 4: Add Environment Variables

In the **Environment variables** section, add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Paste the PostgreSQL connection string from Step 2 |
| `JWT_SECRET` | Any random string 16+ chars (e.g. `my-secret-key-12345`) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `GOOGLE_GEMINI_API_KEY` | Your Gemini API key (optional) |

---

## Step 5: Deploy

1. Click **Deploy**
2. Wait 2–5 minutes for the build
3. When status is **Running**, copy the **Public URL** (e.g. `https://your-app-xxxxx.koyeb.app`)

---

## Step 6: Test the API

Open in a browser:

```
https://YOUR-KOYEB-URL/api/health
```

You should see:

```json
{"ok":true,"timestamp":"..."}
```

---

## Step 7: Update Mobile App

1. Open `mobile-expo/src/config/api.ts`
2. Set:

```typescript
const PROD_API = 'https://YOUR-KOYEB-URL.koyeb.app';
```

3. Rebuild the app or run in production mode

---

## Troubleshooting

**Build fails**
- Check that the GitHub repo is public
- Ensure branch is `main`

**502 or app not responding**
- Confirm `PORT` is set to `3000`
- Confirm `DATABASE_URL` is the full connection string
- Check **Logs** in Koyeb for errors

**Database connection error**
- Ensure the database is **Running**
- Use the connection string from the database’s **Overview** tab
- Do not add extra spaces or quotes
