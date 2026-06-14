# PayWagerr V2

**Smart Payroll. Simplified Workforce Management.**

Enterprise-grade payroll and workforce management SaaS platform built for Indian businesses.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Tailwind CSS, React Query, Redux Toolkit, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Prisma ORM, JWT |
| Database | PostgreSQL |
| API Docs | Swagger UI at `/api/docs` |

## Features

- Company registration with PAN/GST validation
- Employee master with salary structure & compliance flags
- Attendance (manual, biometric, Excel, API)
- Leave management with approval workflow
- Configurable payroll engine with rule builder
- PF & ESI statutory calculations
- PDF salary slip generation with QR verification
- Excel import wizard
- Reports (attendance, payroll, PF, ESI, department cost)
- Role-based access control
- Audit logs & notification center
- Light mode only — modern SaaS UI

## Project Structure

```
paywager/
├── backend/          # Express API + Prisma
│   ├── prisma/       # Database schema & seed
│   └── src/
│       ├── routes/   # API routes
│       ├── services/ # Business logic
│       └── middleware/
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # All module pages
│       ├── components/
│       └── store/
└── package.json      # Monorepo root
```

## Railway Deployment (Production)

Full deployment guide: **[RAILWAY.md](./RAILWAY.md)**

Quick summary — create 3 resources on Railway:
1. **PostgreSQL** database
2. **Backend** service (root: `backend`)
3. **Frontend** service (root: `frontend`)

Key env vars:
- Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`
- Frontend: `VITE_API_URL=https://your-api.up.railway.app/api`

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your PostgreSQL connection string and JWT secrets.

### 3. Initialize database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs

## Demo Credentials

After seeding:

- **Email:** admin@paywager.demo
- **Password:** Admin@123

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run build` | Build both workspaces |
| `npm test` | Run backend unit tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |

## API Modules

- `/api/auth` — Registration & login
- `/api/dashboard` — Dashboard statistics
- `/api/employees` — Employee CRUD
- `/api/attendance` — Attendance management
- `/api/leaves` — Leave types & requests
- `/api/payroll` — Payroll processing & rules
- `/api/salary-slips` — Salary slip PDF generation
- `/api/reports` — Compliance & cost reports
- `/api/import` — Excel import wizard
- `/api/audit-logs` — Activity tracking
- `/api/notifications` — In-app notifications

## Legacy App

The original v1 salary slip app (`server.js`, `public/`) remains in the root directory. Start it with `node server.js` on port 3000 if needed.

## License

Private — All rights reserved.
