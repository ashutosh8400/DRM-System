const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let db;
const authenticatedSessions = new Map();

function isAdminRole(role) {
  return role === 'super_admin' || role === 'admin';
}

function getSessionUser(event) {
  const userId = authenticatedSessions.get(event.sender.id);
  const user = userId ? db.getUser(userId) : null;
  if (user && user.isActive === 0) {
    authenticatedSessions.delete(event.sender.id);
    return null;
  }
  return user;
}

function requireAdmin(event) {
  const user = getSessionUser(event);
  if (!user || !isAdminRole(user.role)) {
    return { authorized: false, response: { success: false, message: 'Unauthorized admin access.' } };
  }
  return { authorized: true, user };
}

function requireUser(event) {
  const user = getSessionUser(event);
  if (!user) {
    return { authorized: false, response: { success: false, message: 'Please login again.' } };
  }
  return { authorized: true, user };
}

function requirePermission(event, permissionKey, message) {
  const auth = requireUser(event);
  if (!auth.authorized) return auth;
  if (!isAdminRole(auth.user.role) && auth.user[permissionKey] === 0) {
    return { authorized: false, response: { success: false, message } };
  }
  return auth;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Initialize database
  db = new Database(path.join(app.getPath('userData'), 'referral_doctor.db'));
  createWindow();

  // Setup IPC handlers for database operations
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function setupIpcHandlers() {
  // Auth handlers
  ipcMain.handle('auth:login', async (event, username, password) => {
    console.log(`[IPC] auth:login called for user: ${username}`);
    const result = db.login(username, password);
    console.log(`[IPC] auth:login result: success=${result.success}, message=${result.message}`);
    if (result.success && result.user) {
      authenticatedSessions.set(event.sender.id, result.user.id);
      console.log(`[IPC] Session established for user: ${result.user.id}`);
    }
    return result;
  });

  ipcMain.handle('auth:restoreSession', async (event, userId) => {
    const user = db.getUser(userId);
    if (!user || user.isActive === 0) {
      authenticatedSessions.delete(event.sender.id);
      return { success: false, message: user && user.isActive === 0 ? 'Account is deactivated' : 'User not found' };
    }
    authenticatedSessions.set(event.sender.id, user.id);
    return { success: true, user };
  });

  ipcMain.handle('auth:logout', async (event) => {
    authenticatedSessions.delete(event.sender.id);
    return { success: true };
  });

  ipcMain.handle('auth:changePassword', async (event, oldPassword, newPassword) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.changePassword(auth.user.id, oldPassword, newPassword);
  });

  // User handlers
  ipcMain.handle('user:get', async (event, userId) => {
    return db.getUser(userId);
  });

  ipcMain.handle('user:getSystemSettings', async () => {
    const settings = db.getSystemSettings();
    return {
      organizationName: settings.organizationName || 'Referral Doctor Management System',
      supportEmail: settings.supportEmail || 'admin@referral.local',
      enableUserBilling: settings.enableUserBilling !== undefined ? settings.enableUserBilling : true,
      enableUserChat: settings.enableUserChat !== undefined ? settings.enableUserChat : true,
    };
  });

  // Admin handlers
  ipcMain.handle('admin:getUsers', async (event) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.getAllUsers();
  });

  ipcMain.handle('admin:createUser', async (event, data) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.createUser(data);
  });

  ipcMain.handle('admin:updateUser', async (event, id, data) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.updateUser(id, data);
  });

  ipcMain.handle('admin:deleteUser', async (event, id) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    if (auth.user.id === id) return { success: false, message: 'You cannot delete your own account while signed in.' };
    return db.deleteUser(id);
  });

  ipcMain.handle('admin:resetUserPassword', async (event, id, password) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.resetUserPassword(id, password);
  });

  ipcMain.handle('admin:getSystemSettings', async (event) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.getSystemSettings();
  });

  ipcMain.handle('admin:updateSystemSettings', async (event, settings) => {
    const auth = requireAdmin(event);
    if (!auth.authorized) return auth.response;
    return db.updateSystemSettings(settings);
  });

  // Doctor handlers
  ipcMain.handle('doctor:getAll', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.getAllDoctors(auth.user.id);
  });

  ipcMain.handle('doctor:add', async (event, doctorData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.addDoctor(doctorData, auth.user.id);
  });

  ipcMain.handle('doctor:update', async (event, id, doctorData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.updateDoctor(id, doctorData, auth.user.id);
  });

  ipcMain.handle('doctor:delete', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.deleteDoctor(id, auth.user.id);
  });

  ipcMain.handle('doctor:getById', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return null;
    return db.getDoctorById(id, auth.user.id);
  });

  ipcMain.handle('doctor:getReferralCount', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return 0;
    return db.getDoctorReferralCount(id, auth.user.id);
  });

  // Patient handlers
  ipcMain.handle('patient:getAll', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.getAllPatients(auth.user.id);
  });

  ipcMain.handle('patient:add', async (event, patientData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.addPatient(patientData, auth.user.id);
  });

  ipcMain.handle('patient:update', async (event, id, patientData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.updatePatient(id, patientData, auth.user.id);
  });

  ipcMain.handle('patient:delete', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.deletePatient(id, auth.user.id);
  });

  ipcMain.handle('patient:getById', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return null;
    return db.getPatientById(id, auth.user.id);
  });

  ipcMain.handle('patient:getVisitHistory', async (event, patientId) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getPatientVisitHistory(patientId, auth.user.id);
  });

  // Referral handlers
  ipcMain.handle('referral:getAll', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.getAllReferrals(auth.user.id);
  });

  ipcMain.handle('referral:add', async (event, referralData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.addReferral(referralData, auth.user.id);
  });

  ipcMain.handle('referral:update', async (event, id, data) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.updateReferral(id, data, auth.user.id);
  });

  ipcMain.handle('referral:delete', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.deleteReferral(id, auth.user.id);
  });

  ipcMain.handle('referral:getByPatient', async (event, patientId) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getReferralsByPatient(patientId, auth.user.id);
  });

  ipcMain.handle('referral:getRecentByDoctor', async (event, doctorId, days = 7) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getRecentReferralsByDoctor(doctorId, days, auth.user.id);
  });

  // Dashboard handlers
  ipcMain.handle('dashboard:getStats', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.getDashboardStats(auth.user.id);
  });

  ipcMain.handle('dashboard:getRecentReferrals', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getRecentReferrals(10, auth.user.id);
  });

  ipcMain.handle('dashboard:getTopDoctors', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getTopDoctors(7, auth.user.id);
  });

  // Billing handlers
  ipcMain.handle('bill:getAll', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.getAllBills(auth.user.id);
  });

  ipcMain.handle('bill:add', async (event, billData) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.addBill(billData, auth.user.id);
  });

  ipcMain.handle('bill:getById', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return null;
    return db.getBillById(id, auth.user.id);
  });

  ipcMain.handle('bill:update', async (event, id, data) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.updateBill(id, data, auth.user.id);
  });

  ipcMain.handle('bill:getByPatient', async (event, patientId) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getBillsByPatient(patientId, auth.user.id);
  });

  ipcMain.handle('bill:delete', async (event, id) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.deleteBill(id);
  });

  // Product handlers
  ipcMain.handle('product:getAll', async () => {
    return db.getProducts();
  });

  // Return handlers
  ipcMain.handle('return:add', async (event, data) => {
    const auth = requireUser(event);
    if (!auth.authorized) return auth.response;
    return db.addReturn(data, auth.user.id);
  });

  ipcMain.handle('return:getByBill', async (event, billId) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getReturnsByBillId(billId, auth.user.id);
  });

  // Report handlers
  ipcMain.handle('report:getDoctorWise', async (event, days = 7) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getDoctorWiseReport(days, auth.user.id);
  });

  ipcMain.handle('report:getRevenue', async (event, days = 30) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getRevenueReport(days, auth.user.id);
  });

  ipcMain.handle('report:getServiceWise', async (event) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getServiceWiseReport(auth.user.id);
  });

  ipcMain.handle('report:getReferralPayment', async (event, days = 7) => {
    const auth = requireUser(event);
    if (!auth.authorized) return [];
    return db.getReferralPaymentReport(days, auth.user.id);
  });

  // License handlers
  ipcMain.handle('license:validate', async () => {
    return db.validateLicense();
  });
}
