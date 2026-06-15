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
  ipcMain.handle('doctor:getAll', async () => {
    return db.getAllDoctors();
  });

  ipcMain.handle('doctor:add', async (event, doctorData) => {
    return db.addDoctor(doctorData);
  });

  ipcMain.handle('doctor:update', async (event, id, doctorData) => {
    return db.updateDoctor(id, doctorData);
  });

  ipcMain.handle('doctor:delete', async (event, id) => {
    return db.deleteDoctor(id);
  });

  ipcMain.handle('doctor:getById', async (event, id) => {
    return db.getDoctorById(id);
  });

  ipcMain.handle('doctor:getReferralCount', async (event, id) => {
    return db.getDoctorReferralCount(id);
  });

  // Patient handlers
  ipcMain.handle('patient:getAll', async () => {
    return db.getAllPatients();
  });

  ipcMain.handle('patient:add', async (event, patientData) => {
    return db.addPatient(patientData);
  });

  ipcMain.handle('patient:update', async (event, id, patientData) => {
    return db.updatePatient(id, patientData);
  });

  ipcMain.handle('patient:delete', async (event, id) => {
    return db.deletePatient(id);
  });

  ipcMain.handle('patient:getById', async (event, id) => {
    return db.getPatientById(id);
  });

  ipcMain.handle('patient:getVisitHistory', async (event, patientId) => {
    return db.getPatientVisitHistory(patientId);
  });

  // Referral handlers
  ipcMain.handle('referral:getAll', async () => {
    return db.getAllReferrals();
  });

  ipcMain.handle('referral:add', async (event, referralData) => {
    return db.addReferral(referralData);
  });

  ipcMain.handle('referral:update', async (event, id, data) => {
    return db.updateReferral(id, data);
  });

  ipcMain.handle('referral:delete', async (event, id) => {
    return db.deleteReferral(id);
  });

  ipcMain.handle('referral:getByPatient', async (event, patientId) => {
    return db.getReferralsByPatient(patientId);
  });

  ipcMain.handle('referral:getRecentByDoctor', async (event, doctorId, days = 7) => {
    return db.getRecentReferralsByDoctor(doctorId, days);
  });

  // Dashboard handlers
  ipcMain.handle('dashboard:getStats', async () => {
    return db.getDashboardStats();
  });

  ipcMain.handle('dashboard:getRecentReferrals', async () => {
    return db.getRecentReferrals(10);
  });

  ipcMain.handle('dashboard:getTopDoctors', async () => {
    return db.getTopDoctors(7);
  });

  // Billing handlers
  ipcMain.handle('bill:getAll', async () => {
    return db.getAllBills();
  });

  ipcMain.handle('bill:add', async (event, billData) => {
    return db.addBill(billData);
  });

  ipcMain.handle('bill:getById', async (event, id) => {
    return db.getBillById(id);
  });

  ipcMain.handle('bill:update', async (event, id, data) => {
    return db.updateBill(id, data);
  });

  ipcMain.handle('bill:getByPatient', async (event, patientId) => {
    return db.getBillsByPatient(patientId);
  });

  ipcMain.handle('bill:delete', async (event, id) => {
    return db.deleteBill(id);
  });

  // Product handlers
  ipcMain.handle('product:getAll', async () => {
    return db.getProducts();
  });

  // Return handlers
  ipcMain.handle('return:add', async (event, data) => {
    return db.addReturn(data);
  });

  ipcMain.handle('return:getByBill', async (event, billId) => {
    return db.getReturnsByBillId(billId);
  });

  // Report handlers
  ipcMain.handle('report:getDoctorWise', async (event, days = 7) => {
    return db.getDoctorWiseReport(days);
  });

  ipcMain.handle('report:getRevenue', async (event, days = 30) => {
    return db.getRevenueReport(days);
  });

  ipcMain.handle('report:getServiceWise', async () => {
    return db.getServiceWiseReport();
  });

  ipcMain.handle('report:getReferralPayment', async (event, days = 7) => {
    return db.getReferralPaymentReport(days);
  });

  // License handlers
  ipcMain.handle('license:validate', async () => {
    return db.validateLicense();
  });
}
