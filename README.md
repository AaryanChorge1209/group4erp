# VVIT ERP — College ERP System

A complete, production-quality College ERP web application built for **VVIT College of Engineering**, featuring a **Library Management System** and a **Placement & Alumni Management** module. Every button is functional — no placeholder UI, no mock data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v3, Recharts, Axios, React Router DOM |
| Backend | Node.js + Express (REST API), JWT Auth, bcryptjs, multer, node-cron |
| Database | SQLite via Prisma ORM |
| Icons | lucide-react |
| Notifications | react-hot-toast |

---

## Project Structure

```
aryan-erp/
├── client/          ← React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── components/   (layout/, ui/)
│   │   ├── contexts/     (AuthContext, ThemeContext)
│   │   ├── lib/          (api.js, utils.js)
│   │   └── pages/        (dashboards/, library/, placement/, alumni/, admin/, ...)
│   └── package.json
│
├── server/          ← Express backend (port 5000)
│   ├── src/
│   │   ├── controllers/  (library/, placement/, alumni, ...)
│   │   ├── routes/       (library/, placement/, alumni, ...)
│   │   ├── middleware/   (auth.js, validate.js)
│   │   └── utils/        (prisma.js, helpers.js, cron.js)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── dev.db        ← SQLite database (auto-created)
│   └── package.json
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### 1. Install dependencies

```bash
# Backend
cd aryan-erp/server
npm install

# Frontend
cd ../client
npm install
```

### 2. Set up the database

```bash
cd aryan-erp/server

# Push schema to SQLite
npx prisma db push

# Seed with realistic demo data (52 books, 33 students, 10 companies, 15 alumni, ...)
node prisma/seed.js
```

### 3. Configure environment

Copy `server/.env.example` to `server/.env` (already provided with defaults for local dev):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="college-erp-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"
PORT=5000
FINE_PER_DAY=2
LOAN_PERIOD_DAYS=14
NODE_ENV=development
```

### 4. Start the servers

**Terminal 1 — Backend:**
```bash
cd aryan-erp/server
node src/index.js
# → Server running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd aryan-erp/client
npm run dev
# → Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## Demo Credentials

All accounts use password: **`Password@123`**

| Role | Email | Dashboard |
|---|---|---|
| 🔑 Admin | `admin@erp.edu` | Full system access, users, audit logs, settings |
| 📚 Librarian | `librarian@erp.edu` | Checkout, return, fines, overdue, digital library |
| 🎓 Student | `student@erp.edu` | My books, fines, reservations, drives, applications |
| 💼 Placement Officer | `placement@erp.edu` | Drives, applications, companies, reports |
| 🏢 Company | `company@erp.edu` | Company drives, applicants, shortlisting |
| 👥 Alumni | `alumni@erp.edu` | Directory, mentorship, donations |

---

## Features

### Module 1: Library Management
- ✅ Book catalog CRUD (title, author, ISBN, category, copies, shelf location)
- ✅ Per-copy barcode tracking — status: Available / Issued / Reserved
- ✅ Barcode checkout & return (keyboard-wedge scanner compatible)
- ✅ Automatic due-date calculation (configurable loan period)
- ✅ Overdue tracking — list with days overdue per book
- ✅ Fine management — configurable per-day rate, pay/waive with receipt (RCPT-YYYY-XXXX)
- ✅ Reservation queue (FIFO) — notifies next student on return, 48-hour hold
- ✅ OPAC public search — by title, author, ISBN, with availability badge
- ✅ Digital repository — PDF upload, browse, in-browser view, download counter
- ✅ Student view — My Books, My Fines, My Reservations, My History
- ✅ Daily cron job — overdue & due-soon in-app notifications (runs at 08:00)
- ✅ Manual reminder trigger from librarian dashboard

### Module 2: Placement & Alumni Management
- ✅ Company self-registration with admin approval workflow
- ✅ Placement drives — role, CTC, date, venue, eligibility rules (CGPA, backlogs, branch, batch)
- ✅ Automatic eligibility filtering — students see only eligible drives
- ✅ Student applications — apply, withdraw, duplicate-application prevention
- ✅ Resume upload + parser (PDF/DOCX) — extracts skills, education, experience
- ✅ Interview rounds — define rounds (Aptitude/Technical/HR), shortlist per round
- ✅ Status pipeline — Applied → Shortlisted → Interview Scheduled → Selected
- ✅ Alumni directory — searchable by batch, branch, company, location
- ✅ Mentorship network — alumni offer mentoring, students request, session logs
- ✅ Donation management — record donations, campaigns with progress bars, leaderboard
- ✅ Reports — placement %, avg/highest CTC, branch-wise, company-wise

### Cross-Cutting
- ✅ JWT authentication + role-based access (6 roles)
- ✅ Notification center — bell icon, unread count, mark as read
- ✅ Audit log — all key actions recorded with user + timestamp
- ✅ Dark / light theme toggle (persisted in localStorage)
- ✅ Responsive — sidebar drawer on mobile, tables scroll on small screens
- ✅ Data tables — sortable, searchable, paginated, CSV export
- ✅ Global settings — loan period, fine per day, college name (Admin)
- ✅ Toast notifications, loading skeletons, empty states, error pages (404/403)

---

## API Overview

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <JWT>`

```
POST   /auth/login                 ← Login
GET    /auth/me                    ← Current user

GET    /library/books              ← Book catalog
GET    /library/books/stats        ← Dashboard stats
GET    /library/books/opac/search  ← Public search (no auth)
POST   /library/issues/checkout    ← Issue a book
POST   /library/issues/return      ← Return a book
GET    /library/issues/overdue     ← All overdue issues
GET    /library/fines              ← Fines list
POST   /library/fines/:id/pay      ← Pay a fine
POST   /library/fines/:id/waive    ← Waive a fine
GET    /library/reservations       ← Reservation queue
GET    /library/digital            ← Digital resources

GET    /placement/drives           ← Placement drives
GET    /placement/drives/:id/eligible-students
POST   /placement/applications     ← Apply to drive
GET    /placement/companies        ← Company list
POST   /placement/companies/:id/approve

GET    /alumni                     ← Alumni directory
GET    /mentorship/mentors         ← Available mentors
POST   /mentorship/requests        ← Request mentorship
GET    /donations                  ← Donations list
GET    /donations/campaigns        ← Donation campaigns
GET    /donations/leaderboard      ← Top donors

GET    /notifications              ← User notifications
GET    /notifications/unread-count
PUT    /notifications/read-all

GET    /reports/library/issues
GET    /reports/placement/summary
GET    /admin/users
GET    /admin/audit-logs
GET    /admin/settings
```

---

## Seed Data Summary

| Entity | Count |
|---|---|
| Books | 52 (with 2–3 copies each, ~104 BookCopy records) |
| Students | 33 (branches: CSE/ECE/MECH/IT/CIVIL/EEE, batches 2022–2023) |
| Book Issues | 20+ (some current, some returned, some overdue) |
| Fines | 10 (mix of paid and unpaid) |
| Reservations | 5+ in queue |
| Digital Resources | 5 (eBooks and journals) |
| Companies | 10 (TCS, Infosys, Google, Microsoft, Amazon, Wipro, HCL, Accenture, Cognizant, Zoho) |
| Placement Drives | 15 (upcoming, ongoing, completed) |
| Applications | 45+ |
| Alumni | 15 |
| Mentorship Requests | 5 |
| Donations | 10 + 2 campaigns |

---

## Environment Variables (.env.example)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=5000
FINE_PER_DAY=2
LOAN_PERIOD_DAYS=14
NODE_ENV=development
```

---

## Scripts

```bash
# Server
npm run start        # Start production server
npm run dev          # Start with nodemon (auto-reload)
npm run db:push      # Push Prisma schema to DB
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio (DB GUI)

# Client
npm run dev          # Start Vite dev server
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

---

## Printable Documents

The following can be generated and printed from within the app:
- **Fine Receipt** — student name, book, amount, overdue days, receipt number, PAID stamp
- **Book Issue Slip** — book details, student info, due date
- **Donation Receipt** — alumni name, amount, purpose, date

---

## License

© 2024 VVIT College of Engineering. All rights reserved.
ERP v1.0.0 — Built with Node.js, React, and Prisma.
