# Quick Start Guide - Referral Doctor Management System

## ⚡ Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd referral-doctor-system
npm install
```

### Step 2: Start Development
```bash
npm run dev
```

The app will automatically:
- Start Vite dev server (http://localhost:5173)
- Launch Electron window with hot reload
- Initialize SQLite database

---

## 🎯 What's Included

### ✅ Complete Features
- [x] Modern hospital ERP-style UI with dark mode
- [x] Role-based access control (4 roles)
- [x] Doctor management with profile pages
- [x] Patient management with visit history timeline
- [x] Referral creation and tracking
- [x] Billing with invoice generation and discounts
- [x] Analytics dashboard with charts
- [x] Reports (Doctor-wise, Service-wise, Revenue, Collection)
- [x] AI Chat interface for queries
- [x] SQLite offline database
- [x] License validation system

### 📊 Dashboard Features
- Real-time KPI cards
- Weekly revenue bar chart
- Service distribution pie chart
- Top doctors ranking
- Recent referrals table
- Quick action buttons

### 👥 Patient Module (CRITICAL)
- ✅ **Visit History Timeline** - Shows all visits with:
  - Date & time
  - Doctor name
  - Service type
  - Reason/notes
- Total visits count (calculated from database)
- First & last visit dates
- Responsive timeline UI

### 💰 Billing Features
- Service selection with pricing
- Multiple items per invoice
- Discount field support
- Payment modes: Cash, UPI, Card
- Professional invoice format

### 📈 Reports Available
1. Doctor-wise performance report
2. Service-wise distribution
3. Monthly revenue trends
4. Daily collection by payment mode

---

## 🗂️ Project Structure Quick Overview

```
referral-doctor-system/
├── electron/              # Electron main process & database
│   ├── main.js           # App entry point
│   ├── database.js       # SQLite operations
│   └── referral_doctor.db
├── src/
│   ├── pages/            # All page components (10 pages)
│   ├── components/       # Reusable UI components
│   ├── styles/           # Global & special CSS
│   ├── utils/            # Helper functions & API wrapper
│   └── App.jsx
├── README.md             # Full documentation
└── QUICK_START.md        # This file
```

---

## 🎨 UI/UX Highlights

- **Sidebar Navigation** - Collapsible, role-aware menu
- **Header** - Quick actions, theme toggle, user menu
- **Dark Mode** - Click moon/sun icon in header
- **Cards** - Modern shadow effects with hover animation
- **Tables** - Searchable, sortable with action buttons
- **Forms** - Validated inputs with helpful labels
- **Timeline** - Beautiful visit history visualization

---

## 🔐 Test Accounts & Permissions

| Feature | Admin | Doctor | Receptionist | Accountant |
|---------|-------|--------|--------------|------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Doctors | ✅ CRUD | ✅ View | ✅ CRUD | ❌ |
| Patients | ✅ CRUD | ✅ View | ✅ CRUD | ❌ |
| Referrals | ✅ CRUD | ✅ Own | ✅ CRUD | ❌ |
| Billing | ✅ CRUD | ❌ | ✅ CRUD | ✅ CRUD |
| Reports | ✅ | ❌ | ❌ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 Key Functionalities

### 1. Doctor Management
```
Home > Doctors
- View all doctors
- Add new doctor
- Edit doctor profile
- Delete doctor
- View doctor details with activity graph
```

### 2. Patient Management
```
Home > Patients
- View all patients
- Add new patient
- Edit patient info
- Delete patient
- Click patient to see visit history timeline
```

### 3. Create Referral
```
Home > Referrals
- Create new referral
- Select patient & doctor
- Choose service type
- Add notes
- Track referral status
```

### 4. Billing
```
Home > Billing
- Create invoice
- Add multiple services
- Apply discount
- Choose payment mode
- Print/export invoice
```

### 5. Analytics
```
Home > Reports
- Doctor-wise metrics
- Service distribution
- Revenue trends
- Payment collection breakdown
```

### 6. Chat
```
Home > AI Chat
- Ask about doctors: "Dr Sharma 7 days"
- Ask about patients: "Patient history"
- Ask about statistics
- Get structured responses
```

---

## 💾 Database

### Automatic Initialization
- Database auto-creates on first run
- Default admin user inserted
- All tables created with proper relationships
- SQLite file: `~/Library/Application Support/referral-doctor-system/` (Mac)
                `C:\Users\{user}\AppData\Roaming\referral-doctor-system\` (Windows)

### Manual Database Reset
Delete the `.db` file and restart app to create fresh database.

---

## 🎯 Next Steps

1. **Run the app**
   ```bash
   npm run dev
   ```

2. **Login** with admin credentials

3. **Explore modules**
   - Add doctors
   - Add patients
   - Create referrals
   - Test billing
   - View reports

4. **Build for production**
   ```bash
   npm run build
   ```

---

## 📱 Features by Role

### Super Admin
Full access to all features including user management and system settings.

### Doctor
View own referrals and patient details. No access to billing or other doctors' data.

### Receptionist
Manage patients and referrals. Create invoices. No access to reports.

### Accountant
Billing and reports only. No access to patient or doctor data.

---

## ⚙️ Build & Distribution

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Creates:
- **dist/** - Optimized React app
- **out/** - Electron executable

### Install Locally
```bash
cd out
# Run .exe (Windows) or .app (Mac)
```

---

## 🐛 Troubleshooting

### "Cannot find module 'better-sqlite3'"
```bash
npm install
npm run dev
```

### Database locked error
- Close the app
- Delete referral_doctor.db
- Restart

### Dark mode not working
- Logout and login again
- Clear localStorage: Press F12 > Console > localStorage.clear()

### Port 5173 already in use
Edit `vite.config.js` and change port number

---

## 📞 Common Tasks

### Add a Doctor
1. Login as Admin or Receptionist
2. Go to Doctors section
3. Click "Add Doctor"
4. Fill form and submit

### Record a Patient Visit
1. Go to Referrals
2. Click "New Referral"
3. Select Patient & Doctor
4. Choose service type
5. Submit

### Create an Invoice
1. Go to Billing
2. Click "New Invoice"
3. Add services with quantities
4. Apply discount if needed
5. Select payment mode
6. Create invoice

### View Patient History
1. Go to Patients
2. Click patient name
3. Scroll to "Visit History Timeline"
4. View all visits with dates

---

## 🎓 Learning Resources

- **React Documentation**: https://react.dev
- **Electron Documentation**: https://www.electronjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **SQLite**: https://www.sqlite.org

---

## 📝 Notes

- All data is stored locally in SQLite
- No internet required after initial setup
- Dark mode preference saved in localStorage
- User session saved in localStorage
- Database backups recommended for production use

---

## ✨ Pro Tips

1. Use dark mode for better performance on OLED screens
2. Test with different roles to understand permissions
3. Add sample data to test reports and analytics
4. Print invoices using Ctrl+P (standard print dialog)
5. Use search in tables to filter results quickly

---

**You're all set! Start using the application immediately. Enjoy! 🎉**

For detailed documentation, see README.md
