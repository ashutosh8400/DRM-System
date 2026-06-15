# Referral Doctor Management System - Complete Dynamic Architecture

## Overview
This is a **100% DYNAMIC** Electron + React + SQLite desktop application. **NO HARDCODED DATA ANYWHERE**. All data is fetched from the SQLite database in real-time.

---

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Desktop**: Electron.js
- **Database**: SQLite (offline)
- **Charts**: Recharts.js
- **IPC**: Electron IPC (Inter-Process Communication)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Main Window (BrowserWindow)                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         React Application (UI Layer)            │  │   │
│  │  │  • Login Page                                  │  │   │
│  │  │  • Dashboard (Dynamic Stats, Charts)           │  │   │
│  │  │  • Doctor Management                           │  │   │
│  │  │  • Patient Management                          │  │   │
│  │  │  • Referral System                             │  │   │
│  │  │  • Billing System                              │  │   │
│  │  │  • Reports & Analytics                         │  │   │
│  │  │  • Chat Interface (Optional)                   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                    ↓ (IPC)                            │   │
│  │         API Client (src/utils/api.js)                │   │
│  │                    ↓ (IPC Invoke)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓ (IPC Handlers)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     IPC Main Handlers (electron/main.js)              │   │
│  │  • auth:login                                         │   │
│  │  • doctor:* (getAll, getById, add, update, delete)   │   │
│  │  • patient:* (getAll, getById, add, update, delete)  │   │
│  │  • referral:* (getAll, add, getByPatient, etc)      │   │
│  │  • dashboard:* (getStats, getRecentReferrals, etc)  │   │
│  │  • bill:* (getAll, add, getById)                    │   │
│  │  • report:* (getDoctorWise, getRevenue, etc)        │   │
│  │  • license:validate                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓ (Method Calls)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   DatabaseManager (electron/database.js)              │   │
│  │   All SQL queries and database operations             │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      SQLite Database (referral_doctor.db)             │   │
│  │  • users                                              │   │
│  │  • doctors                                            │   │
│  │  • patients                                           │   │
│  │  • referrals                                          │   │
│  │  • bills                                              │   │
│  │  • billItems                                          │   │
│  │  • license                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL (hashed SHA256),
  role TEXT NOT NULL (Super Admin, Receptionist, Doctor, Accountant),
  name TEXT NOT NULL,
  email TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. Doctors Table
```sql
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  specialization TEXT,
  email TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 3. Patients Table
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT,
  age INTEGER,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  email TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 4. Referrals Table
```sql
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  doctorId TEXT NOT NULL,
  patientId TEXT NOT NULL,
  serviceType TEXT NOT NULL,
  notes TEXT,
  referralDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' (pending, completed, cancelled),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctorId) REFERENCES doctors(id),
  FOREIGN KEY (patientId) REFERENCES patients(id)
)
```

### 5. Bills Table
```sql
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  billDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paymentMode TEXT,
  paymentStatus TEXT DEFAULT 'pending' (pending, completed, failed),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id)
)
```

### 6. Bill Items Table
```sql
CREATE TABLE billItems (
  id TEXT PRIMARY KEY,
  billId TEXT NOT NULL,
  serviceType TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  FOREIGN KEY (billId) REFERENCES bills(id)
)
```

### 7. License Table
```sql
CREATE TABLE license (
  id TEXT PRIMARY KEY,
  licenseKey TEXT UNIQUE NOT NULL,
  machineId TEXT,
  expiryDate DATE,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Client (src/utils/api.js)

The API client provides a clean interface for React components to communicate with the backend:

### Authentication
```javascript
api.login(username, password)
api.getUser(userId)
```

### Doctor Management
```javascript
api.getDoctors()                    // Fetch all doctors
api.getDoctorById(id)               // Get single doctor
api.addDoctor(data)                 // Add new doctor
api.updateDoctor(id, data)          // Update doctor
api.deleteDoctor(id)                // Delete doctor
api.getDoctorReferralCount(id)      // Count referrals for doctor
```

### Patient Management
```javascript
api.getPatients()                   // Fetch all patients
api.getPatientById(id)              // Get single patient
api.addPatient(data)                // Add new patient
api.updatePatient(id, data)         // Update patient
api.deletePatient(id)               // Delete patient
api.getPatientVisitHistory(id)      // Get patient's referral history
```

### Referral System
```javascript
api.getReferrals()                  // Fetch all referrals
api.addReferral(data)               // Create new referral
api.getReferralsByPatient(id)       // Get referrals for patient
api.getRecentReferralsByDoctor(id, days) // Get doctor's recent referrals
```

### Dashboard
```javascript
api.getDashboardStats()             // Get counts: doctors, patients, today's visits, revenue
api.getRecentReferrals()            // Get latest 10 referrals
api.getTopDoctors()                 // Get top doctors (last 7 days)
```

### Billing
```javascript
api.getBills()                      // Fetch all bills
api.addBill(data)                   // Create new bill with items
api.getBillById(id)                 // Get bill with items
```

### Reports
```javascript
api.getDoctorWiseReport(days)       // Get referrals by doctor (last N days)
api.getRevenueReport(days)          // Get daily revenue (last N days)
api.getServiceWiseReport()          // Get referrals by service type
```

### License
```javascript
api.validateLicense()               // Validate license status
```

---

## How Data Flows (Example: Dashboard)

1. **Component Mount** → `DashboardPage.useEffect()`
2. **API Calls** → `api.getDashboardStats()`, `api.getRecentReferrals()`, etc.
3. **IPC Invoke** → `window.electron.dashboard.getStats()`
4. **Main Process** → `ipcMain.handle('dashboard:getStats', ...)`
5. **Database Query** → `db.getDashboardStats()`
6. **SQL Execution** → `SELECT COUNT(*) FROM doctors`, etc.
7. **Return Data** → JSON response back through IPC
8. **State Update** → `setStats(data)`, `setRecentReferrals(data)`, etc.
9. **Render** → React components re-render with dynamic data

---

## Key Features (All Dynamic)

### 1. Dashboard
- **Total Doctors**: `COUNT(*) FROM doctors`
- **Total Patients**: `COUNT(*) FROM patients`
- **Today's Visits**: `COUNT(*) FROM referrals WHERE DATE(referralDate) = TODAY`
- **Today's Revenue**: `SUM(total) FROM bills WHERE DATE(billDate) = TODAY AND paymentStatus = 'completed'`
- **Top Doctors**: Query with `GROUP BY` and `ORDER BY COUNT DESC` (last 7 days)
- **Recent Referrals**: `SELECT * FROM referrals ORDER BY referralDate DESC LIMIT 10`
- **Service Distribution**: Pie chart with `GROUP BY serviceType`
- **Weekly Revenue**: Bar chart with daily totals for past 7 days

### 2. Doctor Management
- ✅ Add/Edit/Delete doctors (CRUD operations)
- ✅ View all doctors from database
- ✅ Doctor profile page showing:
  - Personal details from `doctors` table
  - Total referrals: `COUNT(*) FROM referrals WHERE doctorId = ?`
  - Last 7 days activity: Referrals with `WHERE referralDate >= DATE('now', '-7 days')`
  - Complete referral history with patient names (JOIN with patients table)

### 3. Patient Management
- ✅ Add/Edit/Delete patients (CRUD operations)
- ✅ View all patients from database
- ✅ Patient profile page showing:
  - Personal details from `patients` table
  - Total visits: `COUNT(*) FROM referrals WHERE patientId = ?`
  - First visit: `MIN(referralDate) FROM referrals WHERE patientId = ?`
  - Last visit: `MAX(referralDate) FROM referrals WHERE patientId = ?`
  - Complete visit history timeline (JOIN with doctors table)

### 4. Referral System
- ✅ Create referral (select doctor + patient + service type + notes)
- ✅ Save to database with timestamp
- ✅ View all referrals with doctor & patient names
- ✅ Filter by patient or doctor
- ✅ Track referral status (pending, completed, cancelled)

### 5. Billing System
- ✅ Create invoice from services
- ✅ Add multiple service items
- ✅ Apply discounts
- ✅ Calculate totals: `total = subtotal - discount`
- ✅ Store all bills in database
- ✅ Print A4 or thermal formats
- ✅ Track payment status

### 6. Reports (Dynamic SQL Queries)
- ✅ **Doctor-wise reports**: Referral counts by doctor
- ✅ **Revenue reports**: Daily/monthly summaries
- ✅ **Top doctors**: Based on referral count
- ✅ **Patient visit history**: Timeline with doctor & service info
- ✅ **Service-wise distribution**: Pie chart of all services

### 7. Role-Based Access
- **Super Admin**: Full access to all modules
- **Receptionist**: Patients + Billing only
- **Doctor**: Only their own referrals
- **Accountant**: Billing + Reports only

---

## File Structure

```
referral-doctor-system/
├── electron/
│   ├── main.js                 # Electron main process + IPC handlers
│   ├── preload.js              # Secure IPC bridge
│   └── database.js             # SQLite manager + all queries
│
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx       # Login (uses api.login)
│   │   ├── DashboardPage.jsx   # Dashboard (fetches all stats)
│   │   ├── DoctorPage.jsx      # Doctor list (dynamic)
│   │   ├── DoctorDetailPage.jsx # Doctor profile (dynamic)
│   │   ├── PatientPage.jsx     # Patient list (dynamic)
│   │   ├── PatientDetailPage.jsx # Patient profile (dynamic)
│   │   ├── ReferralPage.jsx    # Referral management
│   │   ├── BillingPage.jsx     # Billing system
│   │   ├── ReportsPage.jsx     # Dynamic reports
│   │   └── ChatPage.jsx        # Optional AI chat UI
│   │
│   ├── components/
│   │   ├── Sidebar.jsx         # Navigation
│   │   ├── Header.jsx          # Top bar
│   │   ├── StatCard.jsx        # Dashboard cards
│   │   └── RecentReferralsTable.jsx # Dynamic table
│   │
│   ├── styles/
│   │   ├── index.css           # Main styles
│   │   └── special.css         # Print styles (invoices)
│   │
│   ├── utils/
│   │   ├── api.js              # API client (all endpoints)
│   │   └── helpers.js          # Utility functions
│   │
│   ├── App.jsx                 # Main app with routing
│   └── main.jsx                # React entry point
│
├── index.html                  # HTML entry
├── package.json                # Dependencies
├── vite.config.js              # Vite config
├── tailwind.config.js          # Tailwind config
└── referral_doctor.db          # SQLite database (auto-created)
```

---

## Running the Application

### Development Mode
```bash
cd referral-doctor-system
npm install
npm run dev
```
This starts:
- Vite dev server on http://localhost:5173
- Electron app window with hot reload
- SQLite database auto-initialized

### Build for Production
```bash
npm run build
npm run electron:build
```
Creates distributable executable in `/out` folder.

---

## Login Credentials

Only the admin account exists by default:
- **Username**: admin
- **Password**: admin123
- **Role**: Super Admin

Add new users by:
1. Logging in as admin
2. Using the admin panel to create users with roles

---

## Key Advantages of This Architecture

1. **✅ 100% Dynamic**: All data from database, no hardcoding
2. **✅ Offline-First**: Works without internet
3. **✅ Secure**: SQLite stored locally, passwords hashed
4. **✅ Fast**: No network latency, direct database access
5. **✅ Scalable**: Easy to add new features with IPC handlers
6. **✅ Modern UI**: React + Tailwind CSS + Recharts
7. **✅ Professional**: Hospital ERP-style design
8. **✅ Licensed**: License validation system included

---

## Adding New Features

To add a new API endpoint:

1. **Add Database Method** (electron/database.js)
```javascript
newFeature() {
  return this.db.prepare('SELECT * FROM table').all();
}
```

2. **Add IPC Handler** (electron/main.js)
```javascript
ipcMain.handle('feature:get', async () => {
  return db.newFeature();
});
```

3. **Add API Client Method** (src/utils/api.js)
```javascript
async getNewFeature() {
  return await this.electron.feature.get();
}
```

4. **Use in React Component**
```javascript
const data = await api.getNewFeature();
setData(data);
```

---

## Debugging

1. **DevTools**: Press F12 in Electron window
2. **Database**: Check `referral_doctor.db` using SQLite viewer
3. **IPC Calls**: Console logs in both main and renderer processes
4. **API Errors**: Check api.js error handling

---

## Performance Tips

1. Use `async/await` with try-catch
2. Implement pagination for large datasets
3. Use React memo for expensive components
4. Debounce search inputs
5. Cache frequently accessed data

---

## Security Notes

- Passwords are hashed with SHA256
- SQLite is local, no remote data transmission
- Electron context isolation enabled
- IPC methods are explicitly whitelisted in preload.js
- No eval() or dynamic script execution

---

## Conclusion

This is a **production-ready, fully dynamic** Referral Doctor Management System with:
- ✅ Complete CRUD operations
- ✅ Real-time data fetching
- ✅ Dynamic charts and reports
- ✅ Role-based access control
- ✅ Professional UI/UX
- ✅ Offline capabilities
- ✅ License system

All data comes from SQLite in real-time. Zero hardcoded data anywhere.
