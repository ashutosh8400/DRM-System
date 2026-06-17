const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROLE_ALIASES = {
  'Super Admin': 'super_admin',
  superadmin: 'super_admin',
  super_admin: 'super_admin',
  Admin: 'admin',
  admin: 'admin',
  Receptionist: 'user',
  Doctor: 'user',
  Accountant: 'user',
  user: 'user',
};

function normalizeRole(role) {
  return ROLE_ALIASES[role] || role || 'user';
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isBackdated(dateValue) {
  return Boolean(dateValue) && String(dateValue).slice(0, 10) < getTodayString();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
    this.initializeDefaultData();
  }

  initializeTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Doctors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        specialization TEXT,
        email TEXT,
        userId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Patients table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
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
        userId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Referrals table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        doctorId TEXT NOT NULL,
        patientId TEXT NOT NULL,
        serviceType TEXT NOT NULL,
        notes TEXT,
        referralDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        userId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctorId) REFERENCES doctors(id),
        FOREIGN KEY (patientId) REFERENCES patients(id)
      )
    `);

    // Bills table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        billDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        paymentMode TEXT,
        paymentStatus TEXT DEFAULT 'pending',
        notes TEXT,
        userId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(id)
      )
    `);

    // Bill items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS billItems (
        id TEXT PRIMARY KEY,
        billId TEXT NOT NULL,
        serviceType TEXT NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        price REAL DEFAULT 0,
        amount REAL DEFAULT 0,
        FOREIGN KEY (billId) REFERENCES bills(id)
      )
    `);

    // License table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS license (
        id TEXT PRIMARY KEY,
        licenseKey TEXT UNIQUE NOT NULL,
        machineId TEXT,
        expiryDate DATE,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Returns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS returns (
        id TEXT PRIMARY KEY,
        billId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        type TEXT NOT NULL,
        qty INTEGER NOT NULL,
        refundAmount REAL DEFAULT 0,
        exchangeItemId TEXT,
        exchangeQty INTEGER,
        priceDifference REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (billId) REFERENCES bills(id)
      )
    `);

    // Safely apply alterations for existing databases
    try {
      this.db.exec(`ALTER TABLE patients ADD COLUMN visitDate TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE patients ADD COLUMN test TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE patients ADD COLUMN notes TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE doctors ADD COLUMN clinic TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE doctors ADD COLUMN doctorDate TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE doctors ADD COLUMN notes TEXT`);
    } catch (e) {
      // Column may already exist
    }
    for (const table of ['doctors', 'patients', 'referrals', 'bills']) {
      try {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN userId TEXT`);
      } catch (e) {
        // Column may already exist
      }
    }
    try {
      this.db.exec(`ALTER TABLE billItems ADD COLUMN itemType TEXT DEFAULT 'service'`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE billItems ADD COLUMN productId TEXT`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE referrals ADD COLUMN status TEXT DEFAULT 'pending'`);
    } catch (e) {
      // Column may already exist
    }
    try {
      this.db.exec(`ALTER TABLE bills ADD COLUMN referralId TEXT`);
    } catch (e) {
      // Column may already exist
    }
    const billColumns = [
      ['billNo', 'TEXT'],
      ['referralDoctorId', 'TEXT'],
      ['test', 'TEXT'],
      ['amount', 'REAL DEFAULT 0'],
      ['finalAmount', 'REAL DEFAULT 0'],
      ['paidAmount', 'REAL DEFAULT 0'],
      ['dueAmount', 'REAL DEFAULT 0'],
      ['status', "TEXT DEFAULT 'Pending'"],
      ['checkNo', 'TEXT'],
    ];
    for (const [column, type] of billColumns) {
      try {
        this.db.exec(`ALTER TABLE bills ADD COLUMN ${column} ${type}`);
      } catch (e) {
        // Column may already exist
      }
    }
  }

  initializeDefaultData() {
    try {
      console.log('[DB] Initializing default data...');
      const adminExists = this.db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
      
      if (!adminExists) {
        console.log('[DB] Admin user not found. Creating admin...');
        const hashedPassword = hashPassword('admin123');
        console.log(`[DB] Admin password hashed: ${hashedPassword.substring(0, 8)}...`);
        this.db.prepare(`
          INSERT INTO users (id, username, password, role, name, email)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('admin-1', 'admin', hashedPassword, 'super_admin', 'Administrator', 'admin@referral.local');
        console.log('[DB] Admin user created successfully');
      } else {
        console.log(`[DB] Admin user already exists with role: ${adminExists.role}`);
        if (adminExists.role !== normalizeRole(adminExists.role)) {
          this.db.prepare('UPDATE users SET role = ? WHERE id = ?').run(normalizeRole(adminExists.role), adminExists.id);
        }
      }

      const userExists = this.db.prepare('SELECT * FROM users WHERE username = ?').get('user');
      if (!userExists) {
        console.log('[DB] Demo user not found. Creating demo user...');
        this.db.prepare(`
          INSERT INTO users (id, username, password, role, name, email)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('user-1', 'user', hashPassword('user123'), 'user', 'Demo User', 'user@referral.local');
        console.log('[DB] Demo user created successfully');
      } else {
        console.log(`[DB] Demo user already exists with role: ${userExists.role}`);
      }

      const allUsers = this.db.prepare('SELECT id, role FROM users').all();
      const updateRole = this.db.prepare('UPDATE users SET role = ? WHERE id = ?');
      for (const user of allUsers) {
        const normalizedRole = normalizeRole(user.role);
        if (user.role !== normalizedRole) updateRole.run(normalizedRole, user.id);
      }

      for (const table of ['doctors', 'patients', 'referrals', 'bills']) {
        this.db.prepare(`UPDATE ${table} SET userId = ? WHERE userId IS NULL OR userId = ''`).run('user-1');
      }

      const defaultSettings = {
        organizationName: 'Referral Doctor Management System',
        supportEmail: 'admin@referral.local',
        enableUserBilling: true,
        enableUserChat: true,
      };
      const insertSetting = this.db.prepare(`
        INSERT OR IGNORE INTO system_settings (key, value)
        VALUES (?, ?)
      `);
      for (const [key, value] of Object.entries(defaultSettings)) {
        insertSetting.run(key, JSON.stringify(value));
      }

      // Seed default products if empty
      const productCount = this.db.prepare('SELECT COUNT(*) as count FROM products').get().count;
      if (productCount === 0) {
        const { v4: uuidv4 } = require('uuid');
        const defaultProducts = [
          { name: 'Surgical Mask', price: 15, stock: 100 },
          { name: 'Syringe 5ml', price: 20, stock: 50 },
          { name: 'Bandage Roll', price: 35, stock: 80 },
          { name: 'Multivitamin Bottle', price: 250, stock: 30 },
          { name: 'Antiseptic Liquid 100ml', price: 85, stock: 40 },
        ];
        const insertProduct = this.db.prepare(`
          INSERT INTO products (id, name, price, stock)
          VALUES (?, ?, ?, ?)
        `);
        for (const p of defaultProducts) {
          insertProduct.run(uuidv4(), p.name, p.price, p.stock);
        }
      }
    } catch (error) {
      console.log('Error initializing default data:', error);
    }
  }

  // ===================== AUTH METHODS =====================
  login(username, password) {
    try {
      console.log(`[DB] login attempt for user: ${username}`);
      const hashedPassword = hashPassword(password);
      console.log(`[DB] hashed password: ${hashedPassword.substring(0, 8)}...`);
      
      const user = this.db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
        .get(username, hashedPassword);

      if (user) {
        console.log(`[DB] user found: ${user.id}, role: ${user.role}, active: ${user.isActive}`);
        if (user.isActive === 0) {
          return { success: false, message: 'Account is deactivated' };
        }
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: normalizeRole(user.role),
            name: user.name,
            email: user.email,
            isActive: user.isActive,
          }
        };
      }
      console.log(`[DB] user not found with username: ${username}`);
      const allUsers = this.db.prepare('SELECT username FROM users').all();
      console.log(`[DB] available users: ${allUsers.map(u => u.username).join(', ')}`);
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      console.error(`[DB] login error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  getUser(userId) {
    const user = this.db.prepare('SELECT id, username, role, name, email, isActive FROM users WHERE id = ?').get(userId);
    return user ? { ...user, role: normalizeRole(user.role) } : null;
  }

  // ===================== ADMIN METHODS =====================
  getAllUsers() {
    return this.db.prepare('SELECT id, username, role, name, email, isActive, createdAt FROM users ORDER BY createdAt DESC').all()
      .map(user => ({ ...user, role: normalizeRole(user.role) }));
  }

  createUser(data) {
    const { v4: uuidv4 } = require('uuid');
    try {
      if (!data.password) return { success: false, message: 'Password is required.' };
      const id = uuidv4();
      const isActive = data.hasOwnProperty('isActive') ? (data.isActive ? 1 : 0) : 1;
      this.db.prepare(`
        INSERT INTO users (id, username, password, role, name, email, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.username, hashPassword(data.password), normalizeRole(data.role), data.name, data.email || null, isActive);
      return { success: true, id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateUser(id, data) {
    try {
      const existing = this.getUser(id);
      if (!existing) return { success: false, message: 'User not found.' };

      const isActive = data.hasOwnProperty('isActive') ? (data.isActive ? 1 : 0) : existing.isActive;

      if (data.password) {
        this.db.prepare(`
          UPDATE users
          SET username = ?, name = ?, email = ?, role = ?, isActive = ?, password = ?
          WHERE id = ?
        `).run(data.username, data.name, data.email || null, normalizeRole(data.role), isActive, hashPassword(data.password), id);
      } else {
        this.db.prepare(`
          UPDATE users
          SET username = ?, name = ?, email = ?, role = ?, isActive = ?
          WHERE id = ?
        `).run(data.username, data.name, data.email || null, normalizeRole(data.role), isActive, id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  deleteUser(id) {
    try {
      const adminCount = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'admin')").get().count;
      const user = this.getUser(id);
      if (!user) return { success: false, message: 'User not found.' };
      if ((user.role === 'super_admin' || user.role === 'admin') && adminCount <= 1) {
        return { success: false, message: 'At least one admin account is required.' };
      }
      this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  resetUserPassword(id, password) {
    try {
      if (!password) return { success: false, message: 'Password is required.' };
      this.db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getSystemSettings() {
    const rows = this.db.prepare('SELECT key, value FROM system_settings').all();
    return rows.reduce((settings, row) => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (error) {
        settings[row.key] = row.value;
      }
      return settings;
    }, {});
  }

  updateSystemSettings(settings) {
    try {
      const upsert = this.db.prepare(`
        INSERT INTO system_settings (key, value, updatedAt)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP
      `);
      for (const [key, value] of Object.entries(settings || {})) {
        upsert.run(key, JSON.stringify(value));
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ===================== DOCTOR METHODS =====================
  getAllDoctors(userId) {
    return this.db.prepare('SELECT * FROM doctors WHERE userId = ? ORDER BY name').all(userId);
  }

  getDoctorById(id, userId) {
    return this.db.prepare('SELECT * FROM doctors WHERE id = ? AND userId = ?').get(id, userId);
  }

  addDoctor(data, userId) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    try {
      if (isBackdated(data.doctorDate || data.date)) {
        return { success: false, message: 'Backdated doctor entry is not allowed.' };
      }
      this.db.prepare(`
        INSERT INTO doctors (id, name, mobile, address, city, state, pincode, specialization, email, clinic, doctorDate, notes, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name || data.doctorName,
        data.mobile,
        data.address,
        data.city || '',
        data.state || '',
        data.pincode || '',
        data.specialization || '',
        data.email || '',
        data.clinic || '',
        data.doctorDate || data.date || getTodayString(),
        data.notes || '',
        userId
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateDoctor(id, data, userId) {
    try {
      if (isBackdated(data.doctorDate || data.date)) {
        return { success: false, message: 'Backdated doctor entry is not allowed.' };
      }
      this.db.prepare(`
        UPDATE doctors 
        SET name = ?, mobile = ?, address = ?, city = ?, state = ?, pincode = ?, specialization = ?, email = ?, 
            clinic = ?, doctorDate = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        data.name || data.doctorName,
        data.mobile,
        data.address,
        data.city || '',
        data.state || '',
        data.pincode || '',
        data.specialization || '',
        data.email || '',
        data.clinic || '',
        data.doctorDate || data.date || getTodayString(),
        data.notes || '',
        id,
        userId
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  deleteDoctor(id, userId) {
    try {
      this.db.prepare('DELETE FROM doctors WHERE id = ? AND userId = ?').run(id, userId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getDoctorReferralCount(id, userId) {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM referrals WHERE doctorId = ? AND userId = ?').get(id, userId);
    return result.count;
  }

  // ===================== PATIENT METHODS =====================
  getAllPatients(userId) {
    return this.db.prepare('SELECT * FROM patients WHERE userId = ? ORDER BY name').all(userId);
  }

  getPatientById(id, userId) {
    return this.db.prepare('SELECT * FROM patients WHERE id = ? AND userId = ?').get(id, userId);
  }

  addPatient(data, userId) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    try {
      const visitDate = data.visitDate || data.date || getTodayString();
      if (isBackdated(visitDate)) {
        return { success: false, message: 'Backdated patient entry is not allowed.' };
      }

      this.db.prepare(`
        INSERT INTO patients (id, name, mobile, age, gender, address, city, state, pincode, email, visitDate, test, notes, userId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        id, 
        data.name, 
        data.mobile, 
        data.age || null, 
        data.gender || '', 
        data.address || '', 
        data.city || '', 
        data.state || '', 
        data.pincode || '', 
        data.email || '', 
        visitDate,
        data.test || '',
        data.notes || '',
        userId
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updatePatient(id, data, userId) {
    try {
      const visitDate = data.visitDate || data.date || getTodayString();
      if (isBackdated(visitDate)) {
        return { success: false, message: 'Backdated patient entry is not allowed.' };
      }

      this.db.prepare(`
        UPDATE patients 
        SET name = ?, mobile = ?, age = ?, gender = ?, address = ?, city = ?, state = ?, pincode = ?, email = ?, 
            visitDate = ?, test = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        data.name, 
        data.mobile, 
        data.age || null, 
        data.gender || '', 
        data.address || '', 
        data.city || '', 
        data.state || '', 
        data.pincode || '', 
        data.email || '', 
        visitDate,
        data.test || '',
        data.notes || '',
        id,
        userId
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  deletePatient(id) {
    try {
      const deletePatientWithRelatedData = this.db.transaction((patientId) => {
        const bills = this.db.prepare('SELECT id FROM bills WHERE patientId = ?').all(patientId);
        const billIds = bills.map((bill) => bill.id);

        for (const billId of billIds) {
          this.db.prepare('DELETE FROM returns WHERE billId = ?').run(billId);
          this.db.prepare('DELETE FROM billItems WHERE billId = ?').run(billId);
        }

        this.db.prepare('DELETE FROM bills WHERE patientId = ?').run(patientId);
        this.db.prepare('DELETE FROM referrals WHERE patientId = ?').run(patientId);
        const result = this.db.prepare('DELETE FROM patients WHERE id = ?').run(patientId);
        return result.changes;
      });

      const changes = deletePatientWithRelatedData(id);
      if (changes === 0) {
        return { success: false, message: 'Patient not found.' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getPatientVisitHistory(patientId, userId) {
    return this.db.prepare(`
      SELECT 
        r.id,
        r.referralDate as visitDate,
        d.name as doctorName,
        r.serviceType,
        r.notes,
        r.status
      FROM referrals r
      LEFT JOIN doctors d ON r.doctorId = d.id
      WHERE r.patientId = ? AND r.userId = ?
      ORDER BY r.referralDate DESC
    `).all(patientId, userId);
  }

  // ===================== REFERRAL METHODS =====================
  getAllReferrals(userId) {
    return this.db.prepare(`
      SELECT 
        r.*,
        d.name as doctorName,
        p.name as patientName
      FROM referrals r
      LEFT JOIN doctors d ON r.doctorId = d.id
      LEFT JOIN patients p ON r.patientId = p.id
      WHERE r.userId = ?
      ORDER BY r.referralDate DESC
    `).all(userId);
  }

  addReferral(data, userId) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Validate referral date is not backdated
      const referralDate = data.referralDate || todayStr;
      if (referralDate < todayStr) {
        return { success: false, message: 'Referral date cannot be in the past.' };
      }

      this.db.prepare(`
        INSERT INTO referrals (id, doctorId, patientId, serviceType, notes, referralDate, status, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.doctorId, data.patientId, data.serviceType, data.notes, referralDate, 'pending', userId);
      
      return { success: true, id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateReferral(id, data, userId) {
    try {
      const existing = this.db.prepare('SELECT * FROM referrals WHERE id = ? AND userId = ?').get(id, userId);
      if (!existing) return { success: false, message: 'Referral not found.' };

      const referralDate = data.referralDate || existing.referralDate || getTodayString();
      if (isBackdated(referralDate)) {
        return { success: false, message: 'Referral date cannot be in the past.' };
      }

      this.db.prepare(`
        UPDATE referrals 
        SET doctorId = ?, patientId = ?, serviceType = ?, notes = ?, referralDate = ?, status = ?
        WHERE id = ? AND userId = ?
      `).run(
        data.doctorId || existing.doctorId,
        data.patientId || existing.patientId,
        data.serviceType || data.test || existing.serviceType,
        data.hasOwnProperty('notes') ? data.notes : existing.notes,
        referralDate,
        data.status || existing.status || 'pending',
        id,
        userId
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getReferralsByPatient(patientId, userId) {
    return this.getPatientVisitHistory(patientId, userId);
  }

  getRecentReferralsByDoctor(doctorId, days = 7, userId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.db.prepare(`
      SELECT 
        r.*,
        p.name as patientName
      FROM referrals r
      LEFT JOIN patients p ON r.patientId = p.id
      WHERE r.doctorId = ? AND r.referralDate >= ? AND r.userId = ?
      ORDER BY r.referralDate DESC
    `).all(doctorId, startDate.toISOString().split('T')[0], userId);
  }

  deleteReferral(id, userId) {
    try {
      this.db.prepare('DELETE FROM referrals WHERE id = ? AND userId = ?').run(id, userId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ===================== DASHBOARD METHODS =====================
  getDashboardStats(userId) {
    const totalDoctors = this.db.prepare('SELECT COUNT(*) as count FROM doctors WHERE userId = ?').get(userId).count;
    const totalPatients = this.db.prepare('SELECT COUNT(*) as count FROM patients WHERE userId = ?').get(userId).count;
    
    const today = getTodayString();
    const todayReferralVisits = this.db.prepare(
      'SELECT COUNT(*) as count FROM referrals WHERE DATE(referralDate) = ? AND userId = ?'
    ).get(today, userId).count;
    const todayPatientVisits = this.db.prepare(
      'SELECT COUNT(*) as count FROM patients WHERE DATE(visitDate) = ? AND userId = ?'
    ).get(today, userId).count;
    const pendingCount = this.db.prepare(
      "SELECT COUNT(*) as count FROM referrals WHERE status = 'pending' AND userId = ?"
    ).get(userId).count;

    const todayRevenue = this.db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN finalAmount IS NOT NULL AND finalAmount > 0 THEN finalAmount ELSE total END), 0) as total FROM bills 
      WHERE DATE(billDate) = ? AND userId = ? AND (paymentStatus IN ('completed', 'Paid') OR status = 'Paid')
    `).get(today, userId).total;

    return {
      totalDoctors,
      totalPatients,
      todayVisits: todayReferralVisits + todayPatientVisits,
      todayRevenue,
      pendingCount,
    };
  }

  getRecentReferrals(limit = 10, userId) {
    return this.db.prepare(`
      SELECT 
        r.*,
        d.name as doctorName,
        p.name as patientName
      FROM referrals r
      LEFT JOIN doctors d ON r.doctorId = d.id
      LEFT JOIN patients p ON r.patientId = p.id
      WHERE r.userId = ?
      ORDER BY r.referralDate DESC
      LIMIT ?
    `).all(userId, limit);
  }

  getTopDoctors(days = 7, userId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.db.prepare(`
      SELECT 
        d.id,
        d.name,
        COUNT(r.id) as referralCount,
        GROUP_CONCAT(DISTINCT r.serviceType) as serviceTypes
      FROM doctors d
      LEFT JOIN referrals r ON d.id = r.doctorId AND r.referralDate >= ? AND r.userId = ?
      WHERE d.userId = ?
      GROUP BY d.id
      ORDER BY referralCount DESC
      LIMIT 5
    `).all(startDate.toISOString().split('T')[0], userId, userId);
  }

  // ===================== BILLING METHODS =====================
  getAllBills(userId) {
    return this.db.prepare(`
      SELECT 
        b.*,
        p.name as patientName,
        d.name as referralDoctorName
      FROM bills b
      LEFT JOIN patients p ON b.patientId = p.id
      LEFT JOIN doctors d ON b.referralDoctorId = d.id
      WHERE b.userId = ?
      ORDER BY b.billDate DESC
    `).all(userId);
  }

  addBill(data, userId) {
    const { v4: uuidv4 } = require('uuid');
    const billId = uuidv4();
    try {
      const billDate = data.billDate || data.date || getTodayString();
      if (isBackdated(billDate)) {
        return { success: false, message: 'Backdated billing is not allowed.' };
      }

      const amount = toNumber(data.amount ?? data.subtotal);
      const discount = Math.max(0, toNumber(data.discount));
      const finalAmount = Math.max(0, amount - discount);
      const requestedPaidAmount = Math.min(finalAmount, Math.max(0, toNumber(data.paidAmount)));
      const status = requestedPaidAmount >= finalAmount ? 'Paid' : 'Pending';
      const paidAmount = requestedPaidAmount;
      const dueAmount = Math.max(0, finalAmount - paidAmount);
      if (amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0.' };
      }
      if (toNumber(data.discount) < 0 || toNumber(data.paidAmount) < 0) {
        return { success: false, message: 'Negative values are not allowed.' };
      }
      if (discount > amount) {
        return { success: false, message: 'Discount cannot be greater than amount.' };
      }
      if (data.paymentMode === 'Cheque' && !String(data.checkNo || '').trim()) {
        return { success: false, message: 'Check No is required for cheque payments.' };
      }
      const billCount = this.db.prepare('SELECT COUNT(*) as count FROM bills WHERE userId = ?').get(userId).count + 1;
      const billNo = data.billNo || `BILL-${String(billCount).padStart(5, '0')}`;

      this.db.prepare(`
        INSERT INTO bills (
          id, billNo, patientId, referralDoctorId, referralId, test, amount, subtotal, discount,
          finalAmount, total, paidAmount, dueAmount, paymentMode, checkNo, paymentStatus, status, billDate, notes, userId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        billId,
        billNo,
        data.patientId,
        data.referralDoctorId || data.doctorId || null,
        data.referralId || null,
        data.test || '',
        amount,
        amount,
        discount,
        finalAmount,
        finalAmount,
        paidAmount,
        dueAmount,
        data.paymentMode || '',
        data.paymentMode === 'Cheque' ? String(data.checkNo || '').trim() : '',
        status,
        status,
        billDate,
        data.notes || '',
        userId
      );

      // Add bill items
      if (data.items && data.items.length > 0) {
        const insertItem = this.db.prepare(`
          INSERT INTO billItems (id, billId, serviceType, description, quantity, price, amount, itemType, productId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStock = this.db.prepare(`
          UPDATE products SET stock = stock - ? WHERE id = ?
        `);

        for (const item of data.items) {
          const itemType = item.itemType || 'service';
          const productId = item.productId || null;

          insertItem.run(
            uuidv4(),
            billId,
            item.serviceType,
            item.description,
            item.quantity || 1,
            item.price,
            item.amount || (item.quantity || 1) * item.price,
            itemType,
            productId
          );

          // If it's a product, decrement stock
          if (itemType === 'product' && productId) {
            updateStock.run(item.quantity || 1, productId);
          }
        }
      }

      return { success: true, id: billId };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateBill(id, data) {
    try {
      const updateData = [];
      const updateValues = [];
      
      if (data.hasOwnProperty('paymentStatus')) {
        updateData.push('paymentStatus = ?');
        updateValues.push(data.paymentStatus);
      }
      if (data.hasOwnProperty('paymentMode')) {
        updateData.push('paymentMode = ?');
        updateValues.push(data.paymentMode);
      }
      if (data.hasOwnProperty('notes')) {
        updateData.push('notes = ?');
        updateValues.push(data.notes);
      }
      
      updateData.push('updatedAt = CURRENT_TIMESTAMP');
      updateValues.push(id);
      
      const query = `UPDATE bills SET ${updateData.join(', ')} WHERE id = ?`;
      this.db.prepare(query).run(...updateValues);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getBillById(id, userId) {
    const bill = this.db.prepare(`
      SELECT b.*, p.name as patientName, d.name as referralDoctorName
      FROM bills b
      LEFT JOIN patients p ON b.patientId = p.id
      LEFT JOIN doctors d ON b.referralDoctorId = d.id
      WHERE b.id = ? AND b.userId = ?
    `).get(id, userId);
    if (bill) {
      const items = this.db.prepare('SELECT * FROM billItems WHERE billId = ?').all(id);
      bill.items = items;
    }
    return bill;
  }

  getBillsByPatient(patientId, userId) {
    return this.db.prepare(`
      SELECT 
        b.*,
        p.name as patientName,
        d.name as referralDoctorName
      FROM bills b
      LEFT JOIN patients p ON b.patientId = p.id
      LEFT JOIN doctors d ON b.referralDoctorId = d.id
      WHERE b.patientId = ? AND b.userId = ?
      ORDER BY b.billDate DESC
    `).all(patientId, userId);
  }

  deleteBill(id) {
    return { success: false, message: 'Bills cannot be deleted.' };
  }

  // ===================== PRODUCT METHODS =====================
  getProducts() {
    return this.db.prepare('SELECT * FROM products ORDER BY name').all();
  }

  // ===================== RETURN/EXCHANGE METHODS =====================
  getReturnsByBillId(billId, userId) {
    return this.db.prepare(`
      SELECT r.*, p.name as productName, ep.name as exchangeProductName
      FROM returns r
      INNER JOIN bills b ON r.billId = b.id
      LEFT JOIN products p ON r.itemId = p.id
      LEFT JOIN products ep ON r.exchangeItemId = ep.id
      WHERE r.billId = ? AND b.userId = ?
      ORDER BY r.createdAt DESC
    `).all(billId, userId);
  }

  addReturn(data, userId) {
    const { v4: uuidv4 } = require('uuid');
    const returnId = uuidv4();
    try {
      const transaction = this.db.transaction(() => {
        const bill = this.db.prepare('SELECT id FROM bills WHERE id = ? AND userId = ?').get(data.billId, userId);
        if (!bill) throw new Error('Bill not found.');

        // 1. Insert return log
        this.db.prepare(`
          INSERT INTO returns (id, billId, itemId, type, qty, refundAmount, exchangeItemId, exchangeQty, priceDifference)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          returnId,
          data.billId,
          data.itemId,
          data.type,
          data.qty,
          data.refundAmount || 0,
          data.exchangeItemId || null,
          data.exchangeQty || 0,
          data.priceDifference || 0
        );

        // 2. Adjust return item stock (always increment product stock on return)
        this.db.prepare(`
          UPDATE products SET stock = stock + ? WHERE id = ?
        `).run(data.qty, data.itemId);

        // 3. If exchange, adjust exchange item stock (decrement stock)
        if (data.type === 'Exchange' && data.exchangeItemId) {
          this.db.prepare(`
            UPDATE products SET stock = stock - ? WHERE id = ?
          `).run(data.exchangeQty, data.exchangeItemId);
        }

        // 4. Update the bill's total & subtotal (adjust by price difference or refund amount)
        const adjustment = data.type === 'Exchange' ? data.priceDifference : -data.refundAmount;
        this.db.prepare(`
          UPDATE bills
          SET total = total + ?, subtotal = subtotal + ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(adjustment, adjustment, data.billId);
      });

      transaction();
      return { success: true, id: returnId };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateBill(id, data, userId) {
    try {
      const existing = this.db.prepare('SELECT * FROM bills WHERE id = ? AND userId = ?').get(id, userId);
      if (!existing) return { success: false, message: 'Bill not found.' };
      const existingStatus = existing.status || existing.paymentStatus;
      if (existingStatus === 'Paid' || existingStatus === 'completed') {
        return { success: false, message: 'Paid bills cannot be edited.' };
      }

      const billDate = data.billDate || data.date || existing.billDate || getTodayString();
      if (isBackdated(billDate)) {
        return { success: false, message: 'Backdated billing is not allowed.' };
      }

      const amount = data.hasOwnProperty('amount') || data.hasOwnProperty('subtotal')
        ? toNumber(data.amount ?? data.subtotal)
        : toNumber(existing.amount || existing.subtotal);
      const discount = data.hasOwnProperty('discount') ? Math.max(0, toNumber(data.discount)) : toNumber(existing.discount);
      const finalAmount = Math.max(0, amount - discount);
      const requestedPaidAmount = data.hasOwnProperty('paidAmount')
        ? Math.min(finalAmount, Math.max(0, toNumber(data.paidAmount)))
        : Math.min(finalAmount, toNumber(existing.paidAmount));
      const status = requestedPaidAmount >= finalAmount ? 'Paid' : 'Pending';
      const paidAmount = requestedPaidAmount;
      const dueAmount = Math.max(0, finalAmount - paidAmount);
      const paymentMode = data.paymentMode ?? existing.paymentMode ?? '';
      if (amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0.' };
      }
      if (data.hasOwnProperty('discount') && toNumber(data.discount) < 0) {
        return { success: false, message: 'Negative values are not allowed.' };
      }
      if (data.hasOwnProperty('paidAmount') && toNumber(data.paidAmount) < 0) {
        return { success: false, message: 'Negative values are not allowed.' };
      }
      if (discount > amount) {
        return { success: false, message: 'Discount cannot be greater than amount.' };
      }
      if (paymentMode === 'Cheque' && !String(data.checkNo ?? existing.checkNo ?? '').trim()) {
        return { success: false, message: 'Check No is required for cheque payments.' };
      }

      this.db.prepare(`
        UPDATE bills 
        SET patientId = ?, referralDoctorId = ?, referralId = ?, test = ?, amount = ?, subtotal = ?,
            discount = ?, finalAmount = ?, total = ?, paidAmount = ?, dueAmount = ?, paymentMode = ?, checkNo = ?,
            paymentStatus = ?, status = ?, billDate = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        data.patientId || existing.patientId,
        data.referralDoctorId || data.doctorId || existing.referralDoctorId,
        data.referralId || existing.referralId,
        data.test ?? existing.test ?? '',
        amount,
        amount,
        discount,
        finalAmount,
        finalAmount,
        paidAmount,
        dueAmount,
        paymentMode,
        paymentMode === 'Cheque' ? String(data.checkNo ?? existing.checkNo ?? '').trim() : '',
        status,
        status,
        billDate,
        data.notes ?? existing.notes ?? '',
        id,
        userId
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ===================== REPORT METHODS =====================
  getDoctorWiseReport(days = 7, userId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.db.prepare(`
      SELECT 
        d.id,
        d.name,
        COUNT(r.id) as referralCount,
        COUNT(DISTINCT r.patientId) as uniquePatients,
        GROUP_CONCAT(DISTINCT r.serviceType) as serviceTypes
      FROM doctors d
      LEFT JOIN referrals r ON d.id = r.doctorId AND r.referralDate >= ? AND r.userId = ?
      WHERE d.userId = ?
      GROUP BY d.id, d.name
      ORDER BY referralCount DESC
    `).all(startDate.toISOString().split('T')[0], userId, userId);
  }

  getRevenueReport(days = 30, userId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = this.db.prepare(`
      SELECT 
        DATE(billDate) as date,
        COUNT(*) as billCount,
        COALESCE(SUM(CASE WHEN finalAmount IS NOT NULL AND finalAmount > 0 THEN finalAmount ELSE total END), 0) as totalAmount
      FROM bills
      WHERE billDate >= ? AND userId = ? AND (paymentStatus IN ('completed', 'Paid') OR status = 'Paid')
      GROUP BY DATE(billDate)
      ORDER BY date ASC
    `).all(startDate.toISOString().split('T')[0], userId);

    return dailyData;
  }

  getServiceWiseReport(userId) {
    return this.db.prepare(`
      SELECT 
        serviceType,
        COUNT(*) as count
      FROM referrals
      WHERE userId = ?
      GROUP BY serviceType
      ORDER BY count DESC
    `).all(userId);
  }

  getReferralPaymentReport(days = 7, userId) {
    const rangeDays = Math.max(1, Number(days) || 1);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (rangeDays - 1));
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

    return this.db.prepare(`
      SELECT
        r.id as referralId,
        DATE(r.referralDate) as visitDate,
        p.name as patientName,
        p.mobile as patientMobile,
        p.age as patientAge,
        p.gender as patientGender,
        d.name as doctorName,
        d.mobile as doctorMobile,
        COALESCE(r.serviceType, p.test, '') as test,
        r.notes as referralNotes,
        GROUP_CONCAT(DISTINCT b.billNo) as billNos,
        COALESCE(SUM(CASE WHEN b.id IS NOT NULL THEN COALESCE(NULLIF(b.amount, 0), b.subtotal, 0) ELSE 0 END), 0) as amount,
        COALESCE(SUM(CASE WHEN b.id IS NOT NULL THEN COALESCE(b.discount, 0) ELSE 0 END), 0) as discount,
        COALESCE(SUM(CASE WHEN b.id IS NOT NULL THEN COALESCE(NULLIF(b.finalAmount, 0), b.total, 0) ELSE 0 END), 0) as finalAmount,
        COALESCE(SUM(CASE WHEN b.id IS NOT NULL AND (b.status = 'Paid' OR b.paymentStatus IN ('Paid', 'completed')) THEN COALESCE(NULLIF(b.finalAmount, 0), b.total, 0) WHEN b.id IS NOT NULL THEN COALESCE(b.paidAmount, 0) ELSE 0 END), 0) as paidAmount,
        COALESCE(SUM(
          CASE
            WHEN b.id IS NOT NULL AND (b.status = 'Paid' OR b.paymentStatus IN ('Paid', 'completed')) THEN 0
            WHEN b.id IS NOT NULL AND b.dueAmount IS NOT NULL THEN b.dueAmount
            WHEN b.id IS NOT NULL AND (COALESCE(NULLIF(b.finalAmount, 0), b.total, 0) - COALESCE(b.paidAmount, 0)) > 0 THEN COALESCE(NULLIF(b.finalAmount, 0), b.total, 0) - COALESCE(b.paidAmount, 0)
            ELSE 0
          END
        ), 0) as pendingAmount,
        GROUP_CONCAT(DISTINCT b.paymentMode) as paymentModes,
        CASE
          WHEN COUNT(b.id) = 0 THEN 'No Bill'
          WHEN SUM(CASE WHEN b.status = 'Paid' OR b.paymentStatus IN ('Paid', 'completed') THEN 0 ELSE 1 END) = 0 THEN 'Paid'
          ELSE 'Pending'
        END as paymentStatus
      FROM referrals r
      LEFT JOIN patients p ON r.patientId = p.id
      LEFT JOIN doctors d ON r.doctorId = d.id
      LEFT JOIN bills b ON b.referralId = r.id
        OR (b.referralId IS NULL AND b.patientId = r.patientId AND DATE(b.billDate) = DATE(r.referralDate))
      WHERE DATE(r.referralDate) >= ? AND r.userId = ?
      GROUP BY r.id
      ORDER BY DATE(r.referralDate) DESC, p.name ASC
    `).all(start, userId);
  }

  // ===================== LICENSE METHODS =====================
  validateLicense() {
    try {
      const license = this.db.prepare('SELECT * FROM license WHERE isActive = 1').get();
      
      if (!license) {
        return { valid: true, message: 'No license required' }; // Development mode
      }

      const expiryDate = new Date(license.expiryDate);
      const today = new Date();

      if (expiryDate < today) {
        return { valid: false, message: 'License expired', expiryDate: license.expiryDate };
      }

      return { valid: true, expiryDate: license.expiryDate };
    } catch (error) {
      return { valid: true, message: 'License validation passed' };
    }
  }

  addLicense(licenseKey, expiryDate, machineId) {
    const { v4: uuidv4 } = require('uuid');
    try {
      this.db.prepare(`
        INSERT INTO license (id, licenseKey, expiryDate, machineId, isActive)
        VALUES (?, ?, ?, ?, 1)
      `).run(uuidv4(), licenseKey, expiryDate, machineId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = DatabaseManager;
