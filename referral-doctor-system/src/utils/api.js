// Complete API wrapper for Electron IPC calls with localStorage-based fallback for browser mode
class APIClient {
  constructor() {
    this.electron = window.electron;
    if (!this.electron) {
      console.warn('[API] Electron not available. Using localStorage fallback database.');
      this._initMockDb();
    } else {
      console.log('[API] Electron is available. Using IPC for database calls.');
    }
  }

  // Unified IPC / fallback dispatcher with logging
  async _call(moduleName, methodName, ...args) {
    console.log(`[API] ${moduleName}.${methodName}`, args);
    try {
      let result;
      if (
        this.electron &&
        this.electron[moduleName] &&
        typeof this.electron[moduleName][methodName] === 'function'
      ) {
        result = await this.electron[moduleName][methodName](...args);
      } else {
        result = await this._fallbackCall(moduleName, methodName, ...args);
      }
      console.log(`[API] ${moduleName}.${methodName} →`, result);
      return result;
    } catch (error) {
      console.error(`[API] ${moduleName}.${methodName} ERROR:`, error);
      throw error;
    }
  }

  // ─── localStorage helpers ───────────────────────────────────────────────────
  _getTable(name) {
    return JSON.parse(localStorage.getItem(name) || '[]');
  }
  _saveTable(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
  }

  // Ensure mock users have password field (migration helper)
  _ensureUsersHavePasswords() {
    const users = this._getTable('mock_users');
    let needsMigration = users.some(u => !u.password);
    if (needsMigration) {
      console.log('[FALLBACK] Migrating users to add missing password field');
      const migratedUsers = users.map(u => {
        if (!u.password) {
          return { ...u, password: u.username === 'admin' ? 'admin123' : u.username === 'user' ? 'user123' : 'password123' };
        }
        return u;
      });
      this._saveTable('mock_users', migratedUsers);
      return migratedUsers;
    }
    return users;
  }

  // Seed initial data if tables are empty
  _initMockDb() {
    if (!localStorage.getItem('mock_users')) {
      this._saveTable('mock_users', [
        { id: 'admin-1', username: 'admin', password: 'admin123', role: 'super_admin', name: 'Administrator', email: 'admin@referral.local', isActive: 1, createdAt: new Date().toISOString() },
        { id: 'user-1', username: 'user', password: 'user123', role: 'user', name: 'Demo User', email: 'user@referral.local', isActive: 1, createdAt: new Date().toISOString() },
      ]);
    } else {
      // Migrate: add password field to existing users if missing
      const users = this._getTable('mock_users');
      let needsMigration = false;
      const migratedUsers = users.map(u => {
        if (!u.password) {
          needsMigration = true;
          // Assign default passwords based on username
          return { ...u, password: u.username === 'admin' ? 'admin123' : u.username === 'user' ? 'user123' : 'password123' };
        }
        return u;
      });
      if (needsMigration) {
        console.log('[API] Migrating existing users to add password field');
        this._saveTable('mock_users', migratedUsers);
      }
    }
    if (!localStorage.getItem('mock_doctors')) {
      this._saveTable('mock_doctors', [
        { id: '1', name: 'Dr. Rajesh Sharma', mobile: '9876543210', specialization: 'Cardiology', city: 'Delhi', state: 'Delhi', pincode: '110001', address: 'Main Road, Delhi', email: 'dr.sharma@hospital.com', createdAt: new Date().toISOString() },
        { id: '2', name: 'Dr. Priya Patel',   mobile: '9876543211', specialization: 'Pediatrics', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', address: 'South Street, Mumbai', email: 'dr.patel@hospital.com', createdAt: new Date().toISOString() },
        { id: '3', name: 'Dr. Arun Gupta',    mobile: '9876543212', specialization: 'Orthopedics', city: 'Bangalore', state: 'Karnataka', pincode: '560001', address: 'Tech Park, Bangalore', email: 'dr.gupta@hospital.com', createdAt: new Date().toISOString() },
        { id: '4', name: 'Dr. Neha Singh',    mobile: '9876543213', specialization: 'Dermatology', city: 'Pune', state: 'Maharashtra', pincode: '411001', address: 'Market Road, Pune', email: 'dr.singh@hospital.com', createdAt: new Date().toISOString() },
      ]);
    }
    if (!localStorage.getItem('mock_patients')) {
      this._saveTable('mock_patients', [
        { id: '1', name: 'Rajesh Kumar', mobile: '8765432101', age: 45, gender: 'Male',   city: 'Delhi',     state: 'Delhi',         pincode: '110001', address: 'Main Road, Delhi',      email: 'rajesh.kumar@email.com',  createdAt: new Date().toISOString() },
        { id: '2', name: 'Priya Verma',  mobile: '8765432102', age: 32, gender: 'Female', city: 'Mumbai',    state: 'Maharashtra',   pincode: '400001', address: 'South Street, Mumbai', email: 'priya.verma@email.com',   createdAt: new Date().toISOString() },
        { id: '3', name: 'Amit Agarwal', mobile: '8765432103', age: 28, gender: 'Male',   city: 'Bangalore', state: 'Karnataka',     pincode: '560001', address: 'Tech Park, Bangalore', email: 'amit.agarwal@email.com',  createdAt: new Date().toISOString() },
        { id: '4', name: 'Neha Singh',   mobile: '8765432104', age: 35, gender: 'Female', city: 'Pune',      state: 'Maharashtra',   pincode: '411001', address: 'Market Road, Pune',    email: 'neha.singh@email.com',    createdAt: new Date().toISOString() },
      ]);
    }
    if (!localStorage.getItem('mock_referrals')) {
      const now   = new Date().toISOString();
      const yest  = new Date(Date.now() - 86400000).toISOString();
      const d2ago = new Date(Date.now() - 2 * 86400000).toISOString();
      this._saveTable('mock_referrals', [
        { id: '1', doctorId: '1', patientId: '1', serviceType: 'X-Ray',      notes: 'Chest pain',      referralDate: now,   status: 'pending',   createdAt: now   },
        { id: '2', doctorId: '2', patientId: '2', serviceType: 'Ultrasound', notes: 'Abdominal pain',  referralDate: now,   status: 'confirmed', createdAt: now   },
        { id: '3', doctorId: '3', patientId: '3', serviceType: 'Lab Test',   notes: 'Routine checkup', referralDate: yest,  status: 'completed', createdAt: yest  },
        { id: '4', doctorId: '1', patientId: '4', serviceType: 'ECG',        notes: 'Heart screening', referralDate: d2ago, status: 'cancelled', createdAt: d2ago },
      ]);
    }
    if (!localStorage.getItem('mock_bills')) {
      const now  = new Date().toISOString();
      const yest = new Date(Date.now() - 86400000).toISOString();
      this._saveTable('mock_bills', [
        { id: '1', patientId: '1', billDate: now,  subtotal: 5000, discount: 500, total: 4500, paymentMode: 'Cash', paymentStatus: 'completed', items: [], createdAt: now  },
        { id: '2', patientId: '2', billDate: now,  subtotal: 8000, discount: 800, total: 7200, paymentMode: 'UPI',  paymentStatus: 'pending',   items: [], createdAt: now  },
        { id: '3', patientId: '3', billDate: yest, subtotal: 3500, discount: 0,   total: 3500, paymentMode: 'Card', paymentStatus: 'completed', items: [], createdAt: yest },
      ]);
    }
    if (!localStorage.getItem('mock_products')) {
      this._saveTable('mock_products', [
        { id: 'p1', name: 'Surgical Mask', price: 15, stock: 100, createdAt: new Date().toISOString() },
        { id: 'p2', name: 'Syringe 5ml', price: 20, stock: 50, createdAt: new Date().toISOString() },
        { id: 'p3', name: 'Bandage Roll', price: 35, stock: 80, createdAt: new Date().toISOString() },
        { id: 'p4', name: 'Multivitamin Bottle', price: 250, stock: 30, createdAt: new Date().toISOString() },
        { id: 'p5', name: 'Antiseptic Liquid 100ml', price: 85, stock: 40, createdAt: new Date().toISOString() },
      ]);
    }
    if (!localStorage.getItem('mock_returns')) {
      this._saveTable('mock_returns', []);
    }
  }

  // ─── Fallback Handlers ──────────────────────────────────────────────────────
  async _fallbackCall(moduleName, methodName, ...args) {
    console.log(`[FALLBACK] ${moduleName}.${methodName}`, args);
    // ── AUTH ──────────────────────────────────────────────────────────────────
    if (moduleName === 'auth' && methodName === 'login') {
      const [username, password] = args;
      const users = this._ensureUsersHavePasswords();
      console.log(`[FALLBACK] login: found ${users.length} users in localStorage`);
      
      const user = users.find(u => u.username === username);
      if (user) {
        console.log(`[FALLBACK] user found: ${user.id}, checking password...`);
        if (user.password === password) {
          console.log(`[FALLBACK] password matches`);
          if (user.isActive === 0) {
            return { success: false, message: 'Account is deactivated' };
          }
          return { success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, isActive: user.isActive } };
        } else {
          console.log(`[FALLBACK] password mismatch. stored='${user.password}', provided='${password}'`);
        }
      } else {
        console.log(`[FALLBACK] user not found. available: ${users.map(u => u.username).join(', ')}`);
      }
      return { success: false, message: 'Invalid credentials' };
    }

    if (moduleName === 'auth' && methodName === 'restoreSession') {
      const [userId] = args;
      const users = this._getTable('mock_users');
      const user = users.find(u => u.id === userId);
      if (user && user.isActive === 0) {
        return { success: false, message: 'Account is deactivated' };
      }
      if (user) {
        return { success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, isActive: user.isActive } };
      }
      return { success: false };
    }

    if (moduleName === 'auth' && methodName === 'logout') {
      return { success: true };
    }

    if (moduleName === 'user' && methodName === 'get') {
      const users = this._getTable('mock_users');
      const user = users.find(u => u.id === args[0]);
      if (user) {
        const { password, ...rest } = user;
        return rest;
      }
      return { id: 'admin-1', username: 'admin', role: 'super_admin', name: 'Administrator', email: 'admin@referral.local', isActive: 1 };
    }

    if (moduleName === 'user' && methodName === 'getSettings') {
      return JSON.parse(localStorage.getItem('mock_system_settings') || '{"enableUserBilling": true, "enableUserChat": true}');
    }

    if (moduleName === 'admin') {
      let users = this._ensureUsersHavePasswords();
      if (methodName === 'getUsers') {
        // Return users without password field
        return users.map(u => {
          const { password, ...rest } = u;
          return rest;
        });
      }
      if (methodName === 'createUser') {
        const [data] = args;
        if (!data.password) return { success: false, message: 'Password is required.' };
        if (users.some(u => u.username === data.username)) {
          return { success: false, message: 'Username already exists.' };
        }
        const id = Date.now().toString();
        const user = { 
          id, 
          username: data.username, 
          password: data.password,
          name: data.name, 
          email: data.email || '', 
          role: data.role || 'user',
          isActive: data.hasOwnProperty('isActive') ? (data.isActive ? 1 : 0) : 1, 
          createdAt: new Date().toISOString() 
        };
        users.push(user);
        this._saveTable('mock_users', users);
        return { success: true, id };
      }
      if (methodName === 'updateUser') {
        const [id, data] = args;
        const existingUser = users.find(u => u.id === id);
        if (!existingUser) return { success: false, message: 'User not found.' };
        // Check if username is being changed and if new username already exists
        if (data.username !== existingUser.username && users.some(u => u.username === data.username)) {
          return { success: false, message: 'Username already exists.' };
        }
        const updated = users.map(user => {
          if (user.id === id) {
            const updatedUser = { 
              ...user, 
              username: data.username, 
              name: data.name, 
              email: data.email || '',
              role: data.role,
              isActive: data.hasOwnProperty('isActive') ? (data.isActive ? 1 : 0) : user.isActive
            };
            if (data.password) {
              updatedUser.password = data.password;
            }
            return updatedUser;
          }
          return user;
        });
        this._saveTable('mock_users', updated);
        return { success: true };
      }
      if (methodName === 'deleteUser') {
        const [id] = args;
        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) return { success: false, message: 'User not found.' };
        const adminCount = users.filter(u => ['super_admin', 'admin'].includes(u.role)).length;
        if ((userToDelete.role === 'super_admin' || userToDelete.role === 'admin') && adminCount <= 1) {
          return { success: false, message: 'At least one admin account is required.' };
        }
        this._saveTable('mock_users', users.filter(user => user.id !== id));
        return { success: true };
      }
      if (methodName === 'resetUserPassword') {
        const [id, password] = args;
        if (!password) return { success: false, message: 'Password is required.' };
        const userExists = users.some(u => u.id === id);
        if (!userExists) return { success: false, message: 'User not found.' };
        const updated = users.map(u => u.id === id ? { ...u, password } : u);
        this._saveTable('mock_users', updated);
        return { success: true };
      }
      if (methodName === 'getSystemSettings') {
        return JSON.parse(localStorage.getItem('mock_system_settings') || '{}');
      }
      if (methodName === 'updateSystemSettings') {
        const [settings] = args;
        localStorage.setItem('mock_system_settings', JSON.stringify(settings));
        return { success: true };
      }
    }

    // ── DOCTOR ────────────────────────────────────────────────────────────────
    if (moduleName === 'doctor') {
      const doctors = this._getTable('mock_doctors');
      const todayStr = new Date().toISOString().split('T')[0];
      if (methodName === 'getAll') return [...doctors].sort((a, b) => a.name.localeCompare(b.name));
      if (methodName === 'getById') {
        const [id] = args;
        return doctors.find(d => d.id === id) || null;
      }
      if (methodName === 'add') {
        const [data] = args;
        if ((data.doctorDate || data.date) && (data.doctorDate || data.date) < todayStr) {
          return { success: false, message: 'Backdated doctor entry is not allowed.' };
        }
        const id = Date.now().toString();
        doctors.push({ ...data, doctorDate: data.doctorDate || data.date || todayStr, id, createdAt: new Date().toISOString() });
        this._saveTable('mock_doctors', doctors);
        return { success: true, id };
      }
      if (methodName === 'update') {
        const [id, data] = args;
        if ((data.doctorDate || data.date) && (data.doctorDate || data.date) < todayStr) {
          return { success: false, message: 'Backdated doctor entry is not allowed.' };
        }
        const updated = doctors.map(d => d.id === id ? { ...d, ...data, doctorDate: data.doctorDate || data.date || d.doctorDate || todayStr, updatedAt: new Date().toISOString() } : d);
        this._saveTable('mock_doctors', updated);
        return { success: true };
      }
      if (methodName === 'delete') {
        const [id] = args;
        this._saveTable('mock_doctors', doctors.filter(d => d.id !== id));
        return { success: true };
      }
      if (methodName === 'getReferralCount') {
        const [id] = args;
        return this._getTable('mock_referrals').filter(r => r.doctorId === id).length;
      }
    }

    // ── PATIENT ───────────────────────────────────────────────────────────────
    if (moduleName === 'patient') {
      const patients = this._getTable('mock_patients');
      const todayStr = new Date().toISOString().split('T')[0];
      if (methodName === 'getAll') return [...patients].sort((a, b) => a.name.localeCompare(b.name));
      if (methodName === 'getById') {
        const [id] = args;
        return patients.find(p => p.id === id) || null;
      }
      if (methodName === 'add') {
        const [data] = args;
        if ((data.visitDate || data.date) && (data.visitDate || data.date) < todayStr) {
          return { success: false, message: 'Backdated patient entry is not allowed.' };
        }
        const id = Date.now().toString();
        patients.push({ ...data, visitDate: data.visitDate || data.date || todayStr, id, createdAt: new Date().toISOString() });
        this._saveTable('mock_patients', patients);
        return { success: true, id };
      }
      if (methodName === 'update') {
        const [id, data] = args;
        if ((data.visitDate || data.date) && (data.visitDate || data.date) < todayStr) {
          return { success: false, message: 'Backdated patient entry is not allowed.' };
        }
        const updated = patients.map(p => p.id === id ? { ...p, ...data, visitDate: data.visitDate || data.date || p.visitDate || todayStr, updatedAt: new Date().toISOString() } : p);
        this._saveTable('mock_patients', updated);
        return { success: true };
      }
      if (methodName === 'delete') {
        const [id] = args;
        this._saveTable('mock_patients', patients.filter(p => p.id !== id));
        return { success: true };
      }
      if (methodName === 'getVisitHistory') {
        const [patientId] = args;
        const referrals = this._getTable('mock_referrals');
        const doctors   = this._getTable('mock_doctors');
        return referrals
          .filter(r => r.patientId === patientId)
          .map(r => {
            const doc = doctors.find(d => d.id === r.doctorId);
            return { id: r.id, visitDate: r.referralDate, doctorName: doc ? doc.name : 'Unknown Doctor', serviceType: r.serviceType, notes: r.notes, status: r.status };
          })
          .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      }
    }

    // ── REFERRAL ──────────────────────────────────────────────────────────────
    if (moduleName === 'referral') {
      const referrals = this._getTable('mock_referrals');
      const doctors   = this._getTable('mock_doctors');
      const patients  = this._getTable('mock_patients');
      const todayStr = new Date().toISOString().split('T')[0];

      const enrich = r => {
        const doc = doctors.find(d => d.id === r.doctorId);
        const pat = patients.find(p => p.id === r.patientId);
        return { ...r, doctorName: doc ? doc.name : 'Unknown Doctor', patientName: pat ? pat.name : 'Unknown Patient' };
      };

      if (methodName === 'getAll') {
        return referrals.map(enrich).sort((a, b) => new Date(b.referralDate) - new Date(a.referralDate));
      }
      if (methodName === 'add') {
        const [data] = args;
        const referralDate = data.referralDate || todayStr;
        if (referralDate < todayStr) return { success: false, message: 'Referral date cannot be in the past.' };
        const id = Date.now().toString();
        const newRef = { ...data, id, serviceType: data.serviceType || data.test || '', referralDate, status: data.status || 'pending', createdAt: new Date().toISOString() };
        referrals.push(newRef);
        this._saveTable('mock_referrals', referrals);
        return { success: true, id };
      }
      if (methodName === 'update') {
        const [id, data] = args;
        const existing = referrals.find(r => r.id === id);
        if (!existing) return { success: false, message: 'Referral not found.' };
        const referralDate = data.referralDate || existing.referralDate || todayStr;
        if (referralDate < todayStr) return { success: false, message: 'Referral date cannot be in the past.' };
        const updated = referrals.map(r => r.id === id ? {
          ...r,
          ...data,
          serviceType: data.serviceType || data.test || r.serviceType,
          referralDate,
          updatedAt: new Date().toISOString()
        } : r);
        this._saveTable('mock_referrals', updated);
        return { success: true };
      }
      if (methodName === 'delete') {
        const [id] = args;
        this._saveTable('mock_referrals', referrals.filter(r => r.id !== id));
        return { success: true };
      }
      if (methodName === 'getByPatient') {
        const [patientId] = args;
        return this._fallbackCall('patient', 'getVisitHistory', patientId);
      }
      if (methodName === 'getRecentByDoctor') {
        const [doctorId, days = 7] = args;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return referrals
          .filter(r => r.doctorId === doctorId && new Date(r.referralDate) >= cutoff)
          .map(enrich)
          .sort((a, b) => new Date(b.referralDate) - new Date(a.referralDate));
      }
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────────
    if (moduleName === 'dashboard') {
      const doctors   = this._getTable('mock_doctors');
      const patients  = this._getTable('mock_patients');
      const referrals = this._getTable('mock_referrals');
      const bills     = this._getTable('mock_bills');

      if (methodName === 'getStats') {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const todayRefs    = referrals.filter(r => (r.referralDate || '').startsWith(todayStr));
        const todayPatients = patients.filter(p => (p.visitDate || '').startsWith(todayStr));
        const todayRevenue = bills
          .filter(b => (b.billDate || '').startsWith(todayStr) && ['completed', 'Paid'].includes(b.paymentStatus || b.status))
          .reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);

        return {
          totalDoctors:    doctors.length,
          totalPatients:   patients.length,
          todayVisits:     todayRefs.length + todayPatients.length,
          todayRevenue,
          totalReferrals:  referrals.length,
          pendingCount:    referrals.filter(r => r.status === 'pending').length,
          confirmedCount:  referrals.filter(r => r.status === 'confirmed').length,
          completedCount:  referrals.filter(r => r.status === 'completed').length,
          cancelledCount:  referrals.filter(r => r.status === 'cancelled').length,
        };
      }

      if (methodName === 'getRecentReferrals') {
        const [limit = 10] = args;
        const all = await this._fallbackCall('referral', 'getAll');
        return all.slice(0, limit);
      }

      if (methodName === 'getTopDoctors') {
        const [days = 7] = args;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const refCounts = {};
        referrals
          .filter(r => new Date(r.referralDate) >= cutoff)
          .forEach(r => { refCounts[r.doctorId] = (refCounts[r.doctorId] || 0) + 1; });
        return doctors
          .map(d => ({ id: d.id, name: d.name, referralCount: refCounts[d.id] || 0 }))
          .sort((a, b) => b.referralCount - a.referralCount)
          .slice(0, 5);
      }
    }

    // ── BILL ──────────────────────────────────────────────────────────────────
    if (moduleName === 'bill') {
      const bills    = this._getTable('mock_bills');
      const patients = this._getTable('mock_patients');
      const doctors  = this._getTable('mock_doctors');
      const todayStr = new Date().toISOString().split('T')[0];

      const enrichBill = b => {
        const pat = patients.find(p => p.id === b.patientId);
        const doc = doctors.find(d => d.id === b.referralDoctorId);
        return { ...b, patientName: pat ? pat.name : 'Unknown Patient', referralDoctorName: doc ? doc.name : '' };
      };

      if (methodName === 'getAll') {
        return bills.map(enrichBill).sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
      }
      if (methodName === 'add') {
        const [data] = args;
        const billDate = data.billDate || data.date || todayStr;
        if (billDate < todayStr) return { success: false, message: 'Backdated billing is not allowed.' };
        const id = Date.now().toString();
        const amount = Number(data.amount ?? data.subtotal) || 0;
        const discount = Number(data.discount) || 0;
        if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
        if (discount < 0 || Number(data.paidAmount || 0) < 0) return { success: false, message: 'Negative values are not allowed.' };
        if (discount > amount) return { success: false, message: 'Discount cannot be greater than amount.' };
        if (data.paymentMode === 'Cheque' && !String(data.checkNo || '').trim()) {
          return { success: false, message: 'Check No is required for cheque payments.' };
        }
        const finalAmount = Math.max(0, amount - discount);
        const requestedPaidAmount = Math.min(finalAmount, Number(data.paidAmount) || 0);
        const status = data.status || data.paymentStatus || (finalAmount > 0 && requestedPaidAmount >= finalAmount ? 'Paid' : 'Pending');
        const paidAmount = requestedPaidAmount;
        const dueAmount = Math.max(0, finalAmount - paidAmount);
        if (status === 'Paid' && paidAmount <= 0) return { success: false, message: 'Paid status requires paid amount greater than 0.' };
        if (status === 'Paid' && paidAmount < finalAmount) return { success: false, message: 'Paid status requires full final amount to be paid.' };
        const newBill = {
          ...data,
          id,
          billNo: data.billNo || `BILL-${String(bills.length + 1).padStart(5, '0')}`,
          amount,
          subtotal: amount,
          finalAmount,
          total: finalAmount,
          paidAmount,
          dueAmount,
          status,
          paymentStatus: status,
          checkNo: data.paymentMode === 'Cheque' ? String(data.checkNo || '').trim() : '',
          billDate,
          createdAt: new Date().toISOString()
        };
        bills.push(newBill);
        this._saveTable('mock_bills', bills);

        // Adjust stocks for products
        if (data.items && data.items.length > 0) {
          const products = this._getTable('mock_products');
          data.items.forEach(item => {
            if (item.itemType === 'product' && item.productId) {
              const prod = products.find(p => p.id === item.productId);
              if (prod) {
                prod.stock = Math.max(0, prod.stock - (item.quantity || 1));
              }
            }
          });
          this._saveTable('mock_products', products);
        }

        return { success: true, id };
      }
      if (methodName === 'update') {
        const [id, data] = args;
        const existing = bills.find(b => b.id === id);
        if (!existing) return { success: false, message: 'Bill not found.' };
        if (['Paid', 'completed'].includes(existing.status || existing.paymentStatus)) {
          return { success: false, message: 'Paid bills cannot be edited.' };
        }
        const billDate = data.billDate || data.date || existing.billDate || todayStr;
        if (billDate < todayStr) return { success: false, message: 'Backdated billing is not allowed.' };
        const amount = Number(data.amount ?? data.subtotal ?? existing.amount ?? existing.subtotal) || 0;
        const discount = Number(data.discount ?? existing.discount) || 0;
        const nextPaymentMode = data.paymentMode ?? existing.paymentMode ?? '';
        if (amount <= 0) return { success: false, message: 'Amount must be greater than 0.' };
        if ((data.hasOwnProperty('discount') && Number(data.discount) < 0) || (data.hasOwnProperty('paidAmount') && Number(data.paidAmount) < 0)) {
          return { success: false, message: 'Negative values are not allowed.' };
        }
        if (discount > amount) return { success: false, message: 'Discount cannot be greater than amount.' };
        if (nextPaymentMode === 'Cheque' && !String(data.checkNo ?? existing.checkNo ?? '').trim()) {
          return { success: false, message: 'Check No is required for cheque payments.' };
        }
        const finalAmount = Math.max(0, amount - discount);
        const requestedPaidAmount = Math.min(finalAmount, Number(data.paidAmount ?? existing.paidAmount) || 0);
        const status = data.status || data.paymentStatus || (finalAmount > 0 && requestedPaidAmount >= finalAmount ? 'Paid' : 'Pending');
        const paidAmount = requestedPaidAmount;
        const dueAmount = Math.max(0, finalAmount - paidAmount);
        if (status === 'Paid' && paidAmount <= 0) return { success: false, message: 'Paid status requires paid amount greater than 0.' };
        if (status === 'Paid' && paidAmount < finalAmount) return { success: false, message: 'Paid status requires full final amount to be paid.' };
        const updated = bills.map(b => b.id === id ? {
          ...b,
          ...data,
          amount,
          subtotal: amount,
          finalAmount,
          total: finalAmount,
          paidAmount,
          dueAmount,
          status,
          paymentStatus: status,
          checkNo: nextPaymentMode === 'Cheque' ? String(data.checkNo ?? existing.checkNo ?? '').trim() : '',
          billDate,
          updatedAt: new Date().toISOString()
        } : b);
        this._saveTable('mock_bills', updated);
        return { success: true };
      }
      if (methodName === 'delete') {
        return { success: false, message: 'Bills cannot be deleted.' };
      }
      if (methodName === 'getById') {
        const [id] = args;
        const bill = bills.find(b => b.id === id);
        return bill ? enrichBill(bill) : null;
      }
      if (methodName === 'getByPatient') {
        const [patientId] = args;
        return bills
          .filter(b => b.patientId === patientId)
          .map(enrichBill)
          .sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
      }
    }

    // ── PRODUCT ────────────────────────────────────────────────────────────────
    if (moduleName === 'product') {
      const products = this._getTable('mock_products');
      if (methodName === 'getAll') return [...products].sort((a, b) => a.name.localeCompare(b.name));
    }

    // ── RETURN ─────────────────────────────────────────────────────────────────
    if (moduleName === 'return') {
      const returns  = this._getTable('mock_returns');
      const products = this._getTable('mock_products');
      const bills     = this._getTable('mock_bills');

      if (methodName === 'getByBill') {
        const [billId] = args;
        return returns
          .filter(r => r.billId === billId)
          .map(r => {
            const prod = products.find(p => p.id === r.itemId);
            const exProd = products.find(p => p.id === r.exchangeItemId);
            return {
              ...r,
              productName: prod ? prod.name : 'Unknown Product',
              exchangeProductName: exProd ? exProd.name : 'Unknown Product'
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (methodName === 'add') {
        const [data] = args;
        const id = Date.now().toString();
        const newReturn = { ...data, id, createdAt: new Date().toISOString() };
        returns.push(newReturn);
        this._saveTable('mock_returns', returns);

        // Adjust returned item stock
        const updatedProducts = this._getTable('mock_products');
        const prod = updatedProducts.find(p => p.id === data.itemId);
        if (prod) {
          prod.stock = (prod.stock || 0) + (data.qty || 1);
        }

        // If exchange, adjust exchange item stock (decrement stock)
        if (data.type === 'Exchange' && data.exchangeItemId) {
          const exProd = updatedProducts.find(p => p.id === data.exchangeItemId);
          if (exProd) {
            exProd.stock = Math.max(0, (exProd.stock || 0) - (data.exchangeQty || 1));
          }
        }
        this._saveTable('mock_products', updatedProducts);

        // Update the bill's total & subtotal (adjust by price difference or refund amount)
        const adjustment = data.type === 'Exchange' ? (data.priceDifference || 0) : -(data.refundAmount || 0);
        const updatedBills = bills.map(b => {
          if (b.id === data.billId) {
            return {
              ...b,
              subtotal: (b.subtotal || 0) + adjustment,
              total: (b.total || 0) + adjustment,
              updatedAt: new Date().toISOString()
            };
          }
          return b;
        });
        this._saveTable('mock_bills', updatedBills);

        return { success: true, id };
      }
    }

    // ── REPORT ────────────────────────────────────────────────────────────────
    if (moduleName === 'report') {
      const doctors   = this._getTable('mock_doctors');
      const referrals = this._getTable('mock_referrals');
      const bills     = this._getTable('mock_bills');

      if (methodName === 'getDoctorWise') {
        const [days = 7] = args;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return doctors.map(d => {
          const docRefs = referrals.filter(r => r.doctorId === d.id && new Date(r.referralDate) >= cutoff);
          return {
            id: d.id,
            name: d.name,
            referralCount: docRefs.length,
            uniquePatients: new Set(docRefs.map(r => r.patientId)).size,
            serviceTypes: [...new Set(docRefs.map(r => r.serviceType))].join(', '),
          };
        }).sort((a, b) => b.referralCount - a.referralCount);
      }

      if (methodName === 'getRevenue') {
        const [days = 30] = args;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const daily = {};
        bills
          .filter(b => ['completed', 'Paid'].includes(b.paymentStatus || b.status) && new Date(b.billDate) >= cutoff)
          .forEach(b => {
            const dateStr = (b.billDate || '').split('T')[0];
            if (!daily[dateStr]) daily[dateStr] = { date: dateStr, billCount: 0, totalAmount: 0 };
            daily[dateStr].billCount++;
            daily[dateStr].totalAmount += b.finalAmount || b.total || 0;
          });
        return Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
      }

      if (methodName === 'getServiceWise') {
        const counts = {};
        referrals.forEach(r => { counts[r.serviceType] = (counts[r.serviceType] || 0) + 1; });
        return Object.entries(counts)
          .map(([serviceType, count]) => ({ serviceType, count }))
          .sort((a, b) => b.count - a.count);
      }

      if (methodName === 'getReferralPayment') {
        const [days = 7] = args;
        const patients = this._getTable('mock_patients');
        const rangeDays = Math.max(1, Number(days) || 1);
        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - (rangeDays - 1));

        const toDateKey = (value) => String(value || '').slice(0, 10);
        const getFinalAmount = (bill) => Number(bill.finalAmount || bill.total || Math.max(0, Number(bill.amount || bill.subtotal || 0) - Number(bill.discount || 0)));
        const isPaidBill = (bill) => ['Paid', 'completed'].includes(bill.status || bill.paymentStatus);

        return referrals
          .filter(r => new Date(r.referralDate) >= cutoff)
          .map(ref => {
            const patient = patients.find(p => p.id === ref.patientId) || {};
            const doctor = doctors.find(d => d.id === ref.doctorId) || {};
            const refDate = toDateKey(ref.referralDate);
            const matchedBills = bills.filter(b => (
              b.referralId === ref.id ||
              (!b.referralId && b.patientId === ref.patientId && toDateKey(b.billDate) === refDate)
            ));
            const amount = matchedBills.reduce((sum, b) => sum + Number(b.amount || b.subtotal || 0), 0);
            const discount = matchedBills.reduce((sum, b) => sum + Number(b.discount || 0), 0);
            const finalAmount = matchedBills.reduce((sum, b) => sum + getFinalAmount(b), 0);
            const paidAmount = matchedBills.reduce((sum, b) => sum + (isPaidBill(b) ? getFinalAmount(b) : Number(b.paidAmount || 0)), 0);
            const pendingAmount = Math.max(0, finalAmount - paidAmount);

            return {
              referralId: ref.id,
              visitDate: refDate,
              patientName: patient.name || '',
              patientMobile: patient.mobile || '',
              patientAge: patient.age || '',
              patientGender: patient.gender || '',
              doctorName: doctor.name || '',
              doctorMobile: doctor.mobile || '',
              test: ref.serviceType || patient.test || '',
              referralNotes: ref.notes || '',
              billNos: matchedBills.map(b => b.billNo || b.id).filter(Boolean).join(', '),
              amount,
              discount,
              finalAmount,
              paidAmount,
              pendingAmount,
              paymentModes: [...new Set(matchedBills.map(b => b.paymentMode).filter(Boolean))].join(', '),
              paymentStatus: matchedBills.length === 0 ? 'No Bill' : pendingAmount <= 0 ? 'Paid' : 'Pending',
            };
          })
          .sort((a, b) => String(b.visitDate).localeCompare(String(a.visitDate)) || String(a.patientName).localeCompare(String(b.patientName)));
      }
    }

    // ── LICENSE ───────────────────────────────────────────────────────────────
    if (moduleName === 'license' && methodName === 'validate') {
      return { valid: true, message: 'Mock license valid' };
    }

    console.warn(`[API] No handler for ${moduleName}.${methodName}`);
    return null;
  }

  // ─── Public API methods ─────────────────────────────────────────────────────

  // Auth
  async login(username, password) { return this._call('auth', 'login', username, password); }
  async restoreSession(userId)    { return this._call('auth', 'restoreSession', userId); }
  async logout()                  { return this._call('auth', 'logout'); }
  async getUser(userId)            { return this._call('user', 'get', userId); }
  async getPublicSettings()        { return this._call('user', 'getSettings'); }

  // Admin
  async getUsers()                         { return this._call('admin', 'getUsers'); }
  async createUser(data)                   { return this._call('admin', 'createUser', data); }
  async updateUser(id, data)               { return this._call('admin', 'updateUser', id, data); }
  async deleteUser(id)                     { return this._call('admin', 'deleteUser', id); }
  async resetUserPassword(id, password)    { return this._call('admin', 'resetUserPassword', id, password); }
  async getSystemSettings()                { return this._call('admin', 'getSystemSettings'); }
  async updateSystemSettings(settings)     { return this._call('admin', 'updateSystemSettings', settings); }

  // Doctors
  async getDoctors()               { return this._call('doctor', 'getAll'); }
  async getDoctorById(id)          { return this._call('doctor', 'getById', id); }
  async addDoctor(data)            { return this._call('doctor', 'add', data); }
  async updateDoctor(id, data)     { return this._call('doctor', 'update', id, data); }
  async deleteDoctor(id)           { return this._call('doctor', 'delete', id); }
  async getDoctorReferralCount(id) { return this._call('doctor', 'getReferralCount', id); }

  // Patients
  async getPatients()                      { return this._call('patient', 'getAll'); }
  async getPatientById(id)                 { return this._call('patient', 'getById', id); }
  async addPatient(data)                   { return this._call('patient', 'add', data); }
  async updatePatient(id, data)            { return this._call('patient', 'update', id, data); }
  async deletePatient(id)                  { return this._call('patient', 'delete', id); }
  async getPatientVisitHistory(patientId)  { return this._call('patient', 'getVisitHistory', patientId); }

  // Referrals
  async getReferrals()                         { return this._call('referral', 'getAll'); }
  async addReferral(data)                      { return this._call('referral', 'add', data); }
  async updateReferral(id, data)               { return this._call('referral', 'update', id, data); }
  async deleteReferral(id)                     { return this._call('referral', 'delete', id); }
  async getReferralsByPatient(patientId)        { return this._call('referral', 'getByPatient', patientId); }
  async getRecentReferralsByDoctor(doctorId, days = 7) { return this._call('referral', 'getRecentByDoctor', doctorId, days); }

  // Dashboard
  async getDashboardStats()  { return this._call('dashboard', 'getStats'); }
  async getRecentReferrals() { return this._call('dashboard', 'getRecentReferrals'); }
  async getTopDoctors()      { return this._call('dashboard', 'getTopDoctors'); }

  // Billing
  async getBills()           { return this._call('bill', 'getAll'); }
  async addBill(data)        { return this._call('bill', 'add', data); }
  async updateBill(id, data) { return this._call('bill', 'update', id, data); }
  async deleteBill(id)       { return this._call('bill', 'delete', id); }
  async getBillById(id)      { return this._call('bill', 'getById', id); }
  async getBillsByPatient(patientId) { return this._call('bill', 'getByPatient', patientId); }

  // Products
  async getProducts()        { return this._call('product', 'getAll'); }

  // Returns
  async addReturn(data)      { return this._call('return', 'add', data); }
  async getReturnsByBill(billId) { return this._call('return', 'getByBill', billId); }

  // Reports
  async getDoctorWiseReport(days = 7)  { return this._call('report', 'getDoctorWise', days); }
  async getRevenueReport(days = 30)    { return this._call('report', 'getRevenue', days); }
  async getServiceWiseReport()         { return this._call('report', 'getServiceWise'); }
  async getReferralPaymentReport(days = 7) { return this._call('report', 'getReferralPayment', days); }

  // License
  async validateLicense() { return this._call('license', 'validate'); }
}

export default new APIClient();
