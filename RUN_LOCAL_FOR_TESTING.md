# Run Backend Locally for Testing (100% Free)

When cloud hosting has issues, run the backend on your PC and expose it with **ngrok** – free, no credit card.

---

## Step 1: Start the Backend

1. Open a terminal
2. Run:
```powershell
cd "c:\Expense Ai Tracker\backend"
npm run dev
```
3. Wait until you see: `Server running at http://localhost:3000`

---

## Step 2: Install ngrok

1. Go to **https://ngrok.com/download**
2. Download ngrok for Windows
3. Extract the zip
4. (Optional) Sign up at ngrok.com for a free account to get a persistent URL

---

## Step 3: Expose with ngrok

1. Open a **new** terminal (keep the backend running)
2. Run:
```powershell
ngrok http 3000
```
3. ngrok will show a URL like: `https://abc123.ngrok-free.app`
4. **Copy that URL**

---

## Step 4: Update Mobile App

1. Open `mobile-expo/src/config/api.ts`
2. Set `PROD_API` to your ngrok URL (so the app uses it):
```typescript
const PROD_API = 'https://abc123.ngrok-free.app';  // Replace with YOUR ngrok URL
```
3. To force the app to use PROD_API even in dev mode, change the export:
```typescript
export const API_BASE = PROD_API;  // Use ngrok for testing
```
   (Or keep `__DEV__ ? ... : PROD_API` and run the app in release/production mode)

---

## Step 5: Test

1. Run the mobile app: `npx expo start`
2. Scan the QR code or press `a` for Android
3. The app will connect to your local backend via ngrok

---

## Notes

- **ngrok URL changes** each time you restart ngrok (unless you have a paid/static plan)
- **Keep both terminals open** – backend + ngrok must run
- **Free ngrok** may show a warning page on first visit – click "Visit Site"
- When done, press `Ctrl+C` in both terminals to stop
