# PayWage — Railway Deployment Guide

Deploy **PostgreSQL**, **Backend API**, and **Frontend** on Railway from one GitHub repo.

## Architecture on Railway

| Service | Root Directory | Purpose |
|---------|----------------|---------|
| PostgreSQL | (Railway plugin) | Database |
| paywage-api | `backend` | Express API + Prisma |
| paywage-web | `frontend` | React SPA (static) |

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "PayWage V2 with Railway config"
git remote add origin https://github.com/<your-github-username>/paywage.git
git push -u origin main
```

> Replace `<your-github-username>` with your actual GitHub username. Create the empty repo on GitHub first (do not add README if you already have one locally).

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Add PostgreSQL** (Database)
3. **Add GitHub Repo** → select your repository

You will create **two services** from the same repo.

---

## Step 3: Backend Service (`paywage-api`)

1. Duplicate/add a second service from the same repo (or configure the first one)
2. **Settings → Root Directory:** `backend`
3. **Settings → Networking → Generate Domain** (e.g. `paywage-api-production.up.railway.app`)

### Variables (backend service)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference linked Postgres) |
| `JWT_SECRET` | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Random 32+ char string |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your frontend Railway URL (set after Step 4) |

Link PostgreSQL: **Variables → Add Reference → Postgres → DATABASE_URL**

Build & deploy are configured in `backend/railway.toml` and `backend/nixpacks.toml`:
- Generates Prisma client
- Compiles TypeScript
- Runs `prisma migrate deploy`
- Starts with `npm start`
- Health check: `/health`

---

## Step 4: Frontend Service (`paywage-web`)

1. Add another service from the same GitHub repo
2. **Settings → Root Directory:** `frontend`
3. **Settings → Networking → Generate Domain** (e.g. `paywage-web-production.up.railway.app`)

### Variables (frontend service) — set BEFORE first deploy

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://YOUR-BACKEND-DOMAIN.up.railway.app/api` |
| `NODE_ENV` | `production` |

> **Important:** `VITE_API_URL` is baked in at build time. Redeploy frontend after changing it.

---

## Step 5: Cross-link URLs

After both domains are generated:

1. **Backend** → set `FRONTEND_URL` to your frontend domain:
   ```
   https://paywage-web-production.up.railway.app
   ```
2. **Frontend** → confirm `VITE_API_URL` points to backend:
   ```
   https://paywage-api-production.up.railway.app/api
   ```
3. Redeploy both services

---

## Step 6: Seed demo data (optional)

Railway → **paywage-api** → **Shell**:

```bash
npm run db:seed
```

Demo login: `admin@paywage.demo` / `Admin@123`

---

## Verify deployment

| URL | Expected |
|-----|----------|
| `https://YOUR-API.up.railway.app/health` | `{ "status": "ok" }` |
| `https://YOUR-API.up.railway.app/api/docs` | Swagger UI |
| `https://YOUR-WEB.up.railway.app` | PayWage landing page |
| `https://YOUR-WEB.up.railway.app/login` | Login page |

---

## Local development (unchanged)

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:migrate
npm run db:seed
npm run dev
```

Local URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Troubleshooting

### "Merge remote main..." or "Co-authored-by: Cursor" in Railway

This is **NOT an error** — it is just the **Git commit message** of the deployment Railway is running. Scroll down in the deploy logs to find the real error (usually near the bottom in red).

### Frontend keeps crashing (most common)

1. **Root Directory MUST be `frontend`**
   - Railway → your **frontend service** → **Settings** → **Root Directory** → type exactly: `frontend`
   - If this is blank or set to `/`, the app will crash (no start script at repo root).
2. **Start Command:** `node server.mjs`
3. **Build Command:** `npm install --include=dev && npm run build`
4. Set **`VITE_API_URL`** before deploy:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
5. Click **Redeploy** after saving settings.

### Backend / Prisma errors

1. **Root Directory** must be `backend`.
2. Build uses explicit schema path: `--schema=./prisma/schema.prisma`
3. Link `DATABASE_URL` from PostgreSQL service.

| Issue | Fix |
|-------|-----|
| `src refspec main does not match any` | Run `git branch -M main` then push |
| CORS errors | Set `FRONTEND_URL` on backend to exact frontend URL (no trailing slash) |
| API calls fail on frontend | Redeploy frontend with correct `VITE_API_URL` |
| Database connection failed | Link Postgres `DATABASE_URL` reference on backend |
| Migration failed | Check deploy logs; run `npx prisma migrate deploy --schema=./prisma/schema.prisma` in Railway shell |
| Build fails on backend | Ensure root directory is `backend`, not repo root |
| Frontend crash loop | Root directory = `frontend`, start command = `node server.mjs` |

---

## Files added for Railway

```
backend/
  railway.toml      # Build, migrate, health check
  nixpacks.toml     # Node 20 + build phases
  prisma/migrations/  # Production migrations

frontend/
  railway.toml      # Static build + serve
  nixpacks.toml     # Node 20
  .env.example      # VITE_API_URL
```
