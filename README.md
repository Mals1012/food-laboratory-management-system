# 🧪 FoodLab LIMS
### Food Laboratory Information & Quality Management System

> A complete, production-quality full-stack MERN web application for food processing industries — built for professional laboratory management, regulatory compliance, and quality assurance workflows.

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18 + Vite, Tailwind CSS, React Router v7 |
| **State & Auth** | React Context API, JWT tokens |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP** | Axios |
| **PDF** | jsPDF + jspdf-autotable |
| **Backend** | Node.js + Express.js (REST API) |
| **Database** | MongoDB via Mongoose ODM |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **DB Fallback** | `mongodb-memory-server` (auto-start if no MongoDB) |

---

## 📁 Project Structure

```
FOOD LAB MANAGEMENT/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/           # All 12 application pages
│   │   ├── components/      # Shared UI components (Sidebar, Navbar)
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── services/        # Axios API service modules
│   │   ├── hooks/           # useAuth, useNotifications
│   │   ├── utils/           # formatters, coaPdfGenerator
│   │   ├── layouts/         # MainLayout (sidebar + navbar)
│   │   ├── App.jsx          # Router + ProtectedRoute
│   │   └── main.jsx         # React entry point
│   ├── vite.config.js       # Proxy: /api → localhost:5000
│   └── tailwind.config.js
│
├── server/                  # Node.js + Express backend
│   ├── config/db.js         # MongoDB connect (auto-fallback to in-memory)
│   ├── controllers/         # Business logic for all modules
│   ├── middleware/          # auth.js (JWT), audit.js, errorHandler.js
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express API routes
│   ├── seed/seedData.js     # Auto-seed on first run
│   ├── utils/idGenerators.js
│   └── index.js             # Main Express server
│
├── package.json             # Root monorepo scripts
└── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (tested on v24.19.0)
- **npm** v8+
- MongoDB (optional — auto-falls back to embedded in-memory database)

### Installation

```powershell
# 1. Clone / navigate to project directory
cd "d:\Malathi\PROJECTS\FOOD LAB MANAGEMENT"

# 2. Install root + server dependencies
cd server
npm.cmd install

# 3. Install client dependencies
cd ..\client
npm.cmd install
```

### Running the Application

**Start Backend Server (Terminal 1):**
```powershell
cd "d:\Malathi\PROJECTS\FOOD LAB MANAGEMENT\server"
node index.js
```

**Start Frontend Dev Server (Terminal 2):**
```powershell
cd "d:\Malathi\PROJECTS\FOOD LAB MANAGEMENT\client"
npm.cmd run dev
```

**Access the Application:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:5000/api
- 🏥 Health Check: http://localhost:5000/api/health

> **Note:** On first startup, if no external MongoDB is found, the system automatically downloads and starts an embedded MongoDB instance. This takes ~1-2 minutes on the first run only. Subsequent starts are fast.

---

## 🔐 Demo Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|-------------|
| **Admin** | `admin` | `Admin@123` | Full system access, user management, all modules |
| **Lab Manager** | `labmanager` | `Manager@123` | Batch management, test assignment, lab reports |
| **Lab Analyst** | `analyst` | `Analyst@123` | Record test parameters, submit for QA review |
| **Quality Manager** | `qualitymgr` | `Quality@123` | QA approval/rejection, COA generation |
| **Production Staff** | `production` | `Prod@123` | Register batches, view status |
| **Viewer** | `viewer` | `Viewer@123` | Read-only access to all modules |

> 💡 **Quick Login:** The login page includes one-click buttons for all 6 demo accounts.

---

## 🌱 Pre-Seeded Demo Data

The system auto-seeds on first run with realistic demo data:

### Food Batches

| Batch ID | Product | Status | Notes |
|----------|---------|--------|-------|
| BATCH-2026-1001 | Organic Whole Milk 1L | ✅ Approved | COA issued |
| BATCH-2026-1002 | Artisan Sourdough Country Loaf | 🔵 Under Testing | Expiring in ~8 days |
| BATCH-2026-1003 | Cold-Pressed Valencia OJ | ✅ Approved | Expiring in ~25 days |
| BATCH-2026-1004 | Yellowfin Tuna in Olive Oil | 🟡 Quarantined | Histamine non-compliance |
| BATCH-2026-1005 | Hickory Smoked Chicken Breast | 🔵 Under Testing | 2 tests in QA review queue |
| BATCH-2026-1006 | Organic Strawberry Greek Yogurt | ⚪ Registered | No tests yet |
| BATCH-2026-1007 | Cultured Probiotic Buttermilk | 🟡 Quarantined | **EXPIRED** (5 days ago) |

### Laboratory Tests (8 records)
- Chemical Analysis, Microbiological Testing, Heavy Metals & Contaminants
- pH, Moisture, Protein, Fat, E. coli, Salmonella, Lead, Arsenic, Histamine
- 2 tests in "Submitted" status awaiting QA review

### Product Specifications (12 profiles)
- Full regulatory limits for all batch categories
- Used for real-time pass/fail evaluation

---

## 📋 Application Modules

### 1. 🏠 Dashboard
Live analytics with KPI cards, Recharts visualizations, expiry widget, and real-time audit stream. All data sourced from MongoDB.

### 2. 📦 Batch Management
Register and manage food product batches. Auto-generate Batch IDs. Full CRUD with search/filter/pagination.

### 3. 🔬 Quality Testing (Chemical, Micro, Heavy Metals)
Create test records, enter parameter values with real-time spec compliance checking, submit for QA review.

### 4. ✅ QA Review & Approval Workflow
Quality Managers review submitted tests, approve/reject, and add comments. Batch status auto-synchronizes.

**Workflow:** `Submitted → Under Review → Pass / Fail`

### 5. ⏰ Expiry Monitoring
Visual shelf-life dashboard with Red/Orange/Green indicators. Filterable table with bar chart analytics.

### 6. 📄 Certificate of Analysis (COA)
Auto-generate ISO/IEC 17025 accredited COA documents from verified lab results. PDF download + print. Only for Approved batches.

### 7. 🔗 Batch Traceability
5-step visual timeline showing complete batch history from registration through COA issuance.

### 8. 📋 Audit Trail
Immutable chronological log of all system actions. Searchable by user, action type, date range.

### 9. 👥 User Management (Admin only)
Full user CRUD with role assignment, activate/deactivate, secure password management.

### 10. 📊 Product Specifications
View and configure regulatory parameter limits used for automatic pass/fail evaluation.

---

## 🔒 Role-Based Access Control (RBAC)

RBAC is enforced at **both frontend and backend** levels:

- **Frontend:** Role-based nav visibility, permission-gated buttons, `ProtectedRoute` component
- **Backend:** JWT `authenticate` middleware + `authorize(...roles)` middleware on every protected route

No bypass is possible through UI manipulation — every API call validates the JWT token and user role.

---

## 🌐 API Reference

| Resource | Base URL |
|----------|----------|
| Auth | `POST /api/auth/login` |
| Dashboard | `GET /api/dashboard/stats` |
| Batches | `GET/POST /api/batches` |
| Batch Detail | `GET /api/batches/:id` |
| Expiring | `GET /api/batches/expiring` |
| Traceability | `GET /api/batches/:id/traceability` |
| Tests | `GET/POST /api/tests` |
| QA Review | `PATCH /api/tests/:id/review` |
| COA | `GET /api/coa/:batchId` |
| COA Generate | `POST /api/coa/:batchId/generate` |
| Audit Logs | `GET /api/audit-logs` |
| Users | `GET/POST /api/users` |
| Notifications | `GET /api/notifications` |
| Specifications | `GET /api/specifications` |

---

## ⚙️ Environment Variables

Create `server/.env` (copy from `.env.example`):

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodlab_lims
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
```

> If `MONGO_URI` connection fails, the system automatically starts an embedded MongoDB instance — no configuration needed for development.

---

## 🏭 Production Build

```powershell
# Build React frontend
cd client
npm.cmd run build

# Start server (serves both API + static frontend)
cd ..\server
node index.js
```

Access at: http://localhost:5000

---

## 🔧 Troubleshooting

**Server won't start:**
- Check Node.js version: `node --version` (needs v18+)
- First start may take 2-3 minutes (embedded MongoDB binary download)

**Frontend not connecting to API:**
- Ensure server is running on port 5000
- Vite dev server proxy routes `/api/*` → `localhost:5000`

**Login fails:**
- Server must be running and seeded
- Check server logs for `[Seed] Seeding completed successfully!`

**"Cannot GET /api/...":**
- Verify you're calling the right endpoint (see API Reference above)
- All routes require JWT Bearer token header

---

## 📜 Compliance & Standards

The application is designed for compliance with:
- **FSSAI** (Food Safety and Standards Authority of India)
- **Codex Alimentarius** international food standards
- **FDA Title 21 CFR** food regulations
- **ISO/IEC 17025:2017** Testing Laboratory Accreditation
- **NABL / ILAC MRA** accreditation standards

---

*FoodLab LIMS — Enterprise Food Laboratory Information & Quality Management System*
