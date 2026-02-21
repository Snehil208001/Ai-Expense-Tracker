# Railway DATABASE_URL Setup – Fix "empty string" Error

Your app is failing because `DATABASE_URL` is not set **on Railway**.

**Important:** Your local `backend/.env` file is **not** deployed (it's in `.gitignore`). Also, `localhost` in a connection string will not work on Railway—the app runs in the cloud and cannot reach your machine. You must use **Railway's PostgreSQL** database and set the variable in the Railway dashboard.

## Step-by-step

### 1. Open your backend service
- Go to [railway.app](https://railway.app) → your project
- Click **Ai-Expense-Tracker** (your backend service)

### 2. Add the DATABASE_URL variable
- Open the **Variables** tab
- Click **+ New Variable** or **Add Variable**
- **Variable name:** `DATABASE_URL`
- **Value:** use one of these:

#### Option A: Reference (recommended)
If you see **"Add Reference"** or **"Reference"**:
1. Choose **Add Reference** (or **Reference**)
2. Select your **PostgreSQL** service (e.g. `expense-tracker-db`, `Postgres`, `postgresql`)
3. Pick **`DATABASE_URL`**
4. Save

#### Option B: Manual reference syntax
If you add a raw variable, use:
```
${{expense-tracker-db.DATABASE_URL}}
```
Replace `expense-tracker-db` with your actual PostgreSQL service name (check the left sidebar).

#### Option C: Copy from Railway's PostgreSQL
1. Click your **PostgreSQL** service (e.g. `expense-tracker-db`) in the left sidebar
2. Open **Variables** or **Connect** tab
3. Copy the full `DATABASE_URL` value (starts with `postgresql://`—it will have Railway's host, not localhost)
4. In **Ai-Expense-Tracker** → **Variables**, add:
   - Name: `DATABASE_URL`
   - Value: paste the copied URL

### 3. Redeploy
- Go to **Deployments** → click **Redeploy** on the latest deployment
- Or push a new commit to trigger a deploy

### 4. Check
After redeploy, the logs should show Prisma connecting instead of "empty string".

---

## Troubleshooting

**"I added it but still get empty string"**
- Add the variable to the **Ai-Expense-Tracker service** Variables (click the service name → Variables), not only Shared Variables
- Ensure you're in the correct **environment** (e.g. production)
- After adding, trigger a **Redeploy**—variables don't apply to already-running containers

**"I don't have a PostgreSQL service on Railway"**
- In your project → **+ New** → **Database** → **PostgreSQL**
- Railway will create it. Then add `DATABASE_URL` as a reference from that service

**"Application failed to respond" / 502 Bad Gateway**
- Check **Deploy Logs** (expense-tracker-api → Deployments → latest → Logs) for `[start]` messages
- Ensure these variables are set on **expense-tracker-api**:
  - `DATABASE_URL` = `${{expense-tracker-db.DATABASE_URL}}` (reference)
  - `JWT_SECRET` = any string **16+ characters** (e.g. `my-super-secret-jwt-key-12345`)
  - `NODE_ENV` = `production` (optional; Railway may set it)
- Railway sets `PORT` automatically—**do not override it**
- **Networking:** expense-tracker-api → **Settings** → **Networking** → ensure **Target Port** matches your app (default: `3000`, or leave blank to use Railway's `PORT`)
- **Set PORT=3000:** In **Variables**, add `PORT` = `3000` to force the app to listen on 3000. Railway may default to 8080; if target port doesn't match, you get 502.
