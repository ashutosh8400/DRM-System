# Troubleshooting & FAQ

## Common Issues & Solutions

---

## Issue 1: "window.electron is undefined"

**Symptom**: Getting error about electron not being available

**Solution**:
1. Make sure you're running in Electron (not browser dev server)
2. Check preload.js is properly loaded:
```javascript
// electron/main.js - verify this exists:
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  nodeIntegration: false,
  contextIsolation: true,
}
```
3. Restart dev server: `npm run dev`

---

## Issue 2: "API method not found"

**Symptom**: Error like "doctor.getAll is not a function"

**Solution**:
1. Check preload.js exposes the method:
```javascript
// electron/preload.js - should have:
contextBridge.exposeInMainWorld('electron', {
  doctor: {
    getAll: () => ipcRenderer.invoke('doctor:getAll'),
  },
})
```
2. Check electron/main.js has the IPC handler:
```javascript
ipcMain.handle('doctor:getAll', async () => {
  return db.getAllDoctors();
});
```
3. Check electron/database.js has the method:
```javascript
getAllDoctors() {
  return this.db.prepare('SELECT * FROM doctors ORDER BY name').all();
}
```

---

## Issue 3: "Failed to fetch doctors: Cannot read property 'all' of undefined"

**Symptom**: Database errors on startup

**Solution**:
1. Check database.js initializes tables:
```javascript
constructor(dbPath) {
  this.db = new Database(dbPath);
  this.initializeTables();  // ← Make sure this runs
  this.initializeDefaultData();
}
```
2. Delete the old database and let it recreate:
   - Windows: `%APPDATA%\referral-doctor-system\referral_doctor.db`
   - macOS: `~/Library/Application Support/referral-doctor-system/referral_doctor.db`
3. Restart app: `npm run dev`

---

## Issue 4: Dashboard shows 0 for everything

**Symptom**: All stats are zero even though app is running

**Solution**:
1. Check if any data exists in database:
```bash
sqlite3 ~/AppData/Roaming/referral-doctor-system/referral_doctor.db "SELECT COUNT(*) FROM doctors;"
```
2. If count is 0, add test data:
   - Go to Doctors page → Add a doctor
   - Go to Patients page → Add a patient
   - Create a referral
3. Dashboard should update automatically

---

## Issue 5: "Cannot find database file"

**Symptom**: App starts but database is missing

**Solution**:
1. Check database path in electron/main.js:
```javascript
db = new Database(path.join(app.getPath('userData'), 'referral_doctor.db'));
```
2. Verify folder exists:
   - Windows: `%APPDATA%\referral-doctor-system\`
3. Database should auto-create on first run
4. If not, manually create file and tables

---

## Issue 6: "Promise rejection: ipcRenderer.invoke timed out"

**Symptom**: Slow response or hanging when fetching data

**Solution**:
1. Check database query is optimized:
```javascript
// Good: indexed query
SELECT * FROM doctors WHERE id = ?

// Bad: full table scan
SELECT * FROM doctors WHERE name LIKE '%term%'
```
2. Check database isn't corrupted:
```bash
sqlite3 referral_doctor.db "PRAGMA integrity_check;"
```
3. Increase timeout in api.js if needed (for large datasets)

---

## Issue 7: Charts not showing on Dashboard

**Symptom**: Empty chart areas instead of graphs

**Solution**:
1. Check data is being fetched:
   - Open DevTools (F12)
   - Check console for errors
   - Check Network tab for IPC calls
2. Verify data format:
```javascript
// Should be array of objects:
[
  { date: 'Mon', amount: 8000 },
  { date: 'Tue', amount: 12000 },
]

// Not: null, undefined, or wrong structure
```
3. Check Recharts is properly installed:
```bash
npm install recharts
```

---

## Issue 8: Dark mode not working

**Symptom**: Dark mode toggle doesn't change theme

**Solution**:
1. Check Tailwind dark mode is configured:
```javascript
// tailwind.config.js
export default {
  darkMode: 'class',  // ← Important
  // ...
}
```
2. Verify HTML has dark class:
```javascript
// App.jsx
if (darkMode) {
  document.documentElement.classList.add('dark')
}
```
3. Check components use `dark:` classes:
```jsx
<div className="bg-white dark:bg-gray-900">
```

---

## Issue 9: Login not working

**Symptom**: "Invalid credentials" even with correct password

**Solution**:
1. Check admin user exists:
```bash
sqlite3 referral_doctor.db "SELECT * FROM users WHERE username = 'admin';"
```
2. If empty, database wasn't initialized:
   - Delete referral_doctor.db
   - Restart app
3. Check password hashing matches:
```javascript
// In database.js login():
const hashedPassword = crypto.createHash('sha256')
  .update(password)
  .digest('hex');
  
// Password 'admin123' should hash to specific value
```
4. Reset password:
   - Delete user: `DELETE FROM users WHERE username = 'admin';`
   - Restart app to recreate default user

---

## Issue 10: Changes not persisting

**Symptom**: Add doctor but it disappears after refresh

**Solution**:
1. Check addDoctor() in database.js has COMMIT:
```javascript
addDoctor(data) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  try {
    this.db.prepare(`
      INSERT INTO doctors (id, name, ...)
      VALUES (?, ?, ...)
    `).run(id, data.name, ...);  // ← run() auto-commits
    return { success: true, id };
  }
}
```
2. Check IPC handler returns success:
```javascript
ipcMain.handle('doctor:add', async (event, data) => {
  return db.addDoctor(data);  // Should return {success: true}
});
```
3. Check React component handles response:
```javascript
const result = await api.addDoctor(data);
if (result.success) {
  // Refresh doctor list
  loadDoctors();
}
```

---

## Performance Issues

### Slow Dashboard
```javascript
// Problem: Large data fetch
const allBills = await api.getBills(); // 100,000 records

// Solution: Paginate
const todayBills = await api.getBillsByDate(new Date());
```

### Slow Add/Edit
```javascript
// Problem: No indices on foreign keys
// Solution: Add index in database:
CREATE INDEX idx_referral_doctorId ON referrals(doctorId);
CREATE INDEX idx_referral_patientId ON referrals(patientId);
```

### Memory Leak
```javascript
// Problem: Component not cleaning up
useEffect(() => {
  loadData();
  // Missing cleanup!
}, [])

// Solution: Add cleanup
useEffect(() => {
  let isMounted = true;
  loadData().then(data => {
    if (isMounted) setData(data);
  });
  return () => { isMounted = false; };
}, [])
```

---

## Data Validation

### Before Inserting Doctor
```javascript
// In React component:
const validateDoctor = (data) => {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Doctor name required');
  }
  if (!data.specialization) {
    throw new Error('Specialization required');
  }
  return true;
};

const handleAddDoctor = async (data) => {
  try {
    validateDoctor(data);
    const result = await api.addDoctor(data);
    // ... success handling
  } catch (error) {
    // ... error handling
  }
};
```

### Before Creating Referral
```javascript
const validateReferral = (data) => {
  if (!data.doctorId) throw new Error('Doctor required');
  if (!data.patientId) throw new Error('Patient required');
  if (!data.serviceType) throw new Error('Service type required');
  return true;
};
```

---

## Debugging Tips

### 1. Enable Debug Logging
```javascript
// In database.js
getAllDoctors() {
  console.log('Querying all doctors...');
  const result = this.db.prepare('SELECT * FROM doctors').all();
  console.log('Found', result.length, 'doctors');
  return result;
}
```

### 2. Check IPC Communication
```javascript
// In api.js
async getDoctors() {
  console.log('API: getDoctors() called');
  try {
    const result = await this.electron.doctor.getAll();
    console.log('API: Got result:', result);
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### 3. Verify Database Integrity
```bash
# Check database is valid
sqlite3 referral_doctor.db "PRAGMA integrity_check;"

# Check table structure
sqlite3 referral_doctor.db ".schema doctors"

# Check record count
sqlite3 referral_doctor.db "SELECT COUNT(*) FROM doctors;"
```

### 4. Use Chrome DevTools
```
1. Open app
2. Press F12
3. Go to Console tab
4. Type: window.electron
5. Expand and verify all methods exist
```

---

## Database Reset

### Complete Reset
```bash
# Option 1: Delete database file (recommended)
rm ~/AppData/Roaming/referral-doctor-system/referral_doctor.db

# Option 2: Via code
// In database.js constructor
if (resetDatabase) {
  const fs = require('fs');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}
this.db = new Database(dbPath);
this.initializeTables();
```

### Backup Database
```bash
# Create backup
cp ~/AppData/Roaming/referral-doctor-system/referral_doctor.db \
   ~/referral_doctor_backup.db

# Restore from backup
cp ~/referral_doctor_backup.db \
   ~/AppData/Roaming/referral-doctor-system/referral_doctor.db
```

---

## Adding Missing Methods

### If Doctor API is Missing
1. Add to preload.js:
```javascript
doctor: {
  getAll: () => ipcRenderer.invoke('doctor:getAll'),
  add: (data) => ipcRenderer.invoke('doctor:add', data),
  // ... other methods
}
```

2. Add to main.js:
```javascript
ipcMain.handle('doctor:getAll', async () => {
  return db.getAllDoctors();
});
```

3. Add to api.js:
```javascript
async getDoctors() {
  return await this.electron.doctor.getAll();
}
```

4. Use in component:
```javascript
const doctors = await api.getDoctors();
```

---

## FAQ

**Q: Can I use this offline?**  
A: Yes! SQLite is fully offline. App works without internet.

**Q: Where is data stored?**  
A: Windows: `%APPDATA%\referral-doctor-system\referral_doctor.db`

**Q: Can I backup data?**  
A: Yes! Just backup the referral_doctor.db file.

**Q: How do I add users?**  
A: Currently only admin is created by default. Extend database.js to add user management.

**Q: Can I export data?**  
A: Add export methods to database.js + CSV/PDF generation.

**Q: Is it secure?**  
A: Passwords are hashed, SQLite is local, no internet data transmission.

**Q: Can multiple users use it?**  
A: Currently designed for single machine. Can extend for multi-user.

**Q: How do I update/patch the app?**  
A: Update source code → rebuild with `npm run electron:build`

**Q: What about license system?**  
A: License table exists. Implement validation in app startup.

**Q: Can I customize UI?**  
A: Yes! All styles in Tailwind. Modify tailwind.config.js and component classes.

---

## Getting Help

1. **Check Errors**: Open DevTools (F12) and look at console
2. **Read Logs**: Check electron main process logs
3. **Verify Database**: Use SQLite browser to inspect data
4. **Review Code**: Check if method exists in all 3 layers (db → ipc → api → component)
5. **Test Isolated**: Try single API call in console

---

## Next Steps

1. ✅ Start dev server: `npm run dev`
2. ✅ Add test data via UI
3. ✅ Verify Dashboard updates automatically
4. ✅ Check database file was created
5. ✅ Build production: `npm run electron:build`
6. ✅ Distribute to users

You're ready! 🎉
