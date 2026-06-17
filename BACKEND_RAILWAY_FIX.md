# PayWager — Fix Railway Backend Not Running

Your backend domain: **https://backend-production-fa482.up.railway.app**

If this URL does not load, the backend service on Railway is **crashed or misconfigured**.

---

## Step 1: Open Railway backend logs

1. Go to [railway.app](https://railway.app)
2. Open your project
3. Click the **backend** service (not frontend, not Postgres)
4. Open **Deployments** → latest deploy → **View Logs**

Look for errors like:
- `DATABASE_URL is required`
- `JWT_SECRET must be at least 16 characters`
- `Prisma migrate failed`
- `BACKEND CANNOT START`

---

## Step 2: Set required environment variables

**Backend service → Variables** — add ALL of these:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Click **Add Reference** → select **PostgreSQL** → `DATABASE_URL` |
| `JWT_SECRET` | `PayWager_JWT_Secret_2026_ChangeMe_32chars` |
| `JWT_REFRESH_SECRET` | `PayWager_Refresh_Secret_2026_ChangeMe_32` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |

> **Important:** `DATABASE_URL` must come from the linked PostgreSQL service — do not type it manually.

---

## Step 3: Verify service settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Start Command** | `node scripts/start-production.mjs` (auto from `railway.toml`) |
| **Health Check** | `/health` |

---

## Step 4: Link PostgreSQL

1. Backend service → **Settings** → connect to PostgreSQL
2. Add variable reference: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`

If you have no PostgreSQL:
- **New** → **Database** → **PostgreSQL**
- Then link it to the backend service

---

## Step 5: Redeploy

1. Backend service → **Deployments** → **Redeploy**
2. Wait until status is **Active** (green)
3. Test in browser:

```
https://backend-production-fa482.up.railway.app/health
```

Expected:
```json
{"status":"ok","service":"PayWager API","version":"2.0.0"}
```

---

## Step 6: Update Vercel (after backend is running)

| Name | Value |
|------|--------|
| `RAILWAY_API_URL` | `https://backend-production-fa482.up.railway.app` |

Redeploy Vercel frontend.
