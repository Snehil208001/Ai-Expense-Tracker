# Railway DATABASE_URL Setup – Fix "empty string" Error

Your app is failing because `DATABASE_URL` is not set. Add it in the Railway dashboard:

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

#### Option C: Copy from database
1. Click your **PostgreSQL** service
2. Open **Variables** or **Connect**
3. Copy the full `DATABASE_URL` value (starts with `postgresql://`)
4. In **Ai-Expense-Tracker** → **Variables**, add:
   - Name: `DATABASE_URL`
   - Value: paste the copied URL

### 3. Redeploy
- Go to **Deployments** → click **Redeploy** on the latest deployment
- Or push a new commit to trigger a deploy

### 4. Check
After redeploy, the logs should show Prisma connecting instead of "empty string".
