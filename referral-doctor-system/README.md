# Referral Doctor Management System

A production-level desktop application for managing medical referrals, patient records, billing, and analytics.

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time analytics with charts and KPIs
- **Doctor Management** - Complete doctor directory with referral tracking
- **Patient Management** - Patient records with comprehensive visit history timeline
- **Referral System** - Create and track patient referrals with multiple service types
- **Billing System** - Professional invoice generation with discount support
- **Reports & Analytics** - Doctor-wise, service-wise, revenue, and collection reports
- **AI Chat Assistant** - Query system using natural language
- **Role-Based Access Control** - Super Admin, Receptionist, Doctor, Accountant roles

### Technical Features
- **Offline SQLite Database** - No internet required
- **Dark/Light Mode** - User preference toggle
- **Modern UI** - Hospital ERP-style interface with Tailwind CSS
- **Charts & Analytics** - Recharts for data visualization
- **Responsive Design** - Works on desktop and tablets

## 🛠️ Tech Stack

- **Frontend**: React 18 + React Router
- **Desktop**: Electron 27
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS + Custom CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build**: Vite + Electron Builder

## 📦 Installation & Setup

### Prerequisites
- Node.js 14+ and npm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

This command will:
- Start Vite dev server on http://localhost:5173
- Launch Electron app connected to the dev server
- Enable hot reload for React components

### Step 3: Build for Production
```bash
npm run build
```

This creates:
- Optimized React bundle in `/dist`
- Electron executable in `/out`

##  Project Structure

```
referral-doctor-system/
├── electron/
│   ├── main.js           # Electron main process
│   ├── preload.js        # IPC bridge to frontend
│   ├── database.js       # SQLite database manager
│   └── referral_doctor.db # SQLite database file
├── src/
│   ├── pages/            # React page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DoctorPage.jsx
│   │   ├── DoctorDetailPage.jsx
│   │   ├── PatientPage.jsx
│   │   ├── PatientDetailPage.jsx
│   │   ├── ReferralPage.jsx
│   │   ├── BillingPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── ChatPage.jsx
│   ├── components/       # Reusable components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── DoctorForm.jsx
│   │   ├── DoctorTable.jsx
│   │   ├── PatientForm.jsx
│   │   ├── ReferralForm.jsx
│   │   ├── BillingForm.jsx
│   │   ├── StatCard.jsx
│   │   └── RecentReferralsTable.jsx
│   ├── styles/           # Global styles
│   │   └── index.css
│   ├── App.jsx           # Main app component
│   └── main.jsx          # React entry point
├── public/               # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html

## 🎯 Key Features Implementation

### 1. Patient Visit History (CRITICAL)
- Timeline view showing all visits with exact dates
- Each visit displays:
  - Date & Time
  - Doctor Name
  - Service Type
  - Reason/Notes
- Calculated metrics:
  - Total Visits Count
  - First Visit Date
  - Last Visit Date

Access at: `/patients/{id}`

### 2. Billing System
- Service selection with automatic pricing
- Multi-item invoicing
- Discount field support
- Three payment modes: Cash, UPI, Card
- Final Amount = Subtotal - Discount

### 3. Role-Based Access
- **Super Admin**: Full system access
- **Receptionist**: Manage patients, referrals, billing
- **Doctor**: View own referrals and patient info
- **Accountant**: Billing and reports only

### 4. Database Schema

#### Users Table
- id, username, password, role, name, email

#### Doctors Table
- id, name, mobile, address, city, specialization, email

#### Patients Table
- id, name, mobile, age, gender, address, city

#### Referrals Table
- id, doctorId, patientId, serviceType, notes, referralDate, status

#### Bills Table
- id, patientId, subtotal, discount, total, paymentMode, paymentStatus

#### BillItems Table
- id, billId, serviceType, quantity, price, amount

#### License Table
- id, licenseKey, machineId, expiryDate, isActive

## 🔒 License System

The app includes a local license validation system:
- Checks license on startup
- Blocks app if expired
- License stored in SQLite database
- Machine-based validation ready

## 📊 Dashboard Widgets

1. **Key Metrics**: Total doctors, patients, visits, revenue
2. **Weekly Revenue Chart**: Bar chart of daily revenue
3. **Service Distribution**: Pie chart of service types
4. **Top Referring Doctors**: Last 7 days ranking
5. **Recent Referrals Table**: Last 10 referrals
6. **Quick Actions**: Fast buttons for common tasks

## 📈 Reports Available

1. **Doctor-Wise Report**: Performance metrics by doctor
2. **Service-Wise Report**: Service usage distribution
3. **Revenue Report**: Daily/monthly revenue trends
4. **Daily Collection Report**: Payment mode breakdown
5. **Patient Visit Reports**: Visit history and analytics

## 🎨 UI/UX Features

- Modern hospital ERP design
- Smooth animations and transitions
- Card-based dashboard layout
- Professional color scheme
- Responsive grid layouts
- Collapsible sidebar navigation
- Dark mode with persistent preference
- Accessible forms with validation

## 🚀 Performance Optimizations

- SQLite with WAL mode for better concurrency
- React components with lazy loading ready
- Optimized Recharts rendering
- Efficient search and filtering
- Local database caching

## 📝 Development Notes

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `App.jsx`
3. Add menu item in `Sidebar.jsx` if needed
4. Create corresponding components in `src/components/`

### Adding Database Operations
1. Implement in `electron/database.js`
2. Add IPC handler in `electron/main.js`
3. Expose in `electron/preload.js`
4. Call via `window.electron` in React

### Styling
- Use Tailwind CSS classes for responsive design
- Custom CSS in `src/styles/index.css` for special effects
- Follow dark mode pattern with `dark:` prefix

## 🔧 Configuration

### Database Path
- Development: User data directory
- Production: App data directory

### Port Configuration
- Vite Dev Server: 5173
- Electron: Connects to Vite in dev mode

## 📦 Building & Distribution

```bash
# Build application
npm run build

# Output locations
dist/          # React optimized bundle
out/           # Electron executables and installer
```

## 🐛 Troubleshooting

### App not connecting to dev server
- Ensure Vite server is running on port 5173
- Check firewall settings

### Database errors
- Delete `referral_doctor.db` and restart (will recreate)
- Check file permissions in app data directory

### Dark mode not working
- Clear browser cache
- Check localStorage in DevTools

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review database.js for SQL issues
3. Check console for error messages
4. Verify role permissions in Sidebar.jsx

## 📄 License

This system is designed for hospital and clinic management.

## 🎉 Ready to Use

The system is production-ready with:
- ✅ Complete CRUD operations
- ✅ Form validations
- ✅ Error handling
- ✅ Role-based access control
- ✅ Offline database
- ✅ Professional UI
- ✅ Analytics and reports
- ✅ Dark mode support

**Start using it immediately after running `npm install && npm run dev`**
