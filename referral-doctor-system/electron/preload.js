const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Auth API
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    restoreSession: (userId) => ipcRenderer.invoke('auth:restoreSession', userId),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },

  // User API
  user: {
    get: (userId) => ipcRenderer.invoke('user:get', userId),
    getSettings: () => ipcRenderer.invoke('user:getSystemSettings'),
  },

  // Admin API
  admin: {
    getUsers: () => ipcRenderer.invoke('admin:getUsers'),
    createUser: (data) => ipcRenderer.invoke('admin:createUser', data),
    updateUser: (id, data) => ipcRenderer.invoke('admin:updateUser', id, data),
    deleteUser: (id) => ipcRenderer.invoke('admin:deleteUser', id),
    resetUserPassword: (id, password) => ipcRenderer.invoke('admin:resetUserPassword', id, password),
    getSystemSettings: () => ipcRenderer.invoke('admin:getSystemSettings'),
    updateSystemSettings: (settings) => ipcRenderer.invoke('admin:updateSystemSettings', settings),
  },

  // Doctor API
  doctor: {
    getAll: () => ipcRenderer.invoke('doctor:getAll'),
    add: (data) => ipcRenderer.invoke('doctor:add', data),
    update: (id, data) => ipcRenderer.invoke('doctor:update', id, data),
    delete: (id) => ipcRenderer.invoke('doctor:delete', id),
    getById: (id) => ipcRenderer.invoke('doctor:getById', id),
    getReferralCount: (id) => ipcRenderer.invoke('doctor:getReferralCount', id),
  },

  // Patient API
  patient: {
    getAll: () => ipcRenderer.invoke('patient:getAll'),
    add: (data) => ipcRenderer.invoke('patient:add', data),
    update: (id, data) => ipcRenderer.invoke('patient:update', id, data),
    delete: (id) => ipcRenderer.invoke('patient:delete', id),
    getById: (id) => ipcRenderer.invoke('patient:getById', id),
    getVisitHistory: (patientId) => ipcRenderer.invoke('patient:getVisitHistory', patientId),
  },

  // Referral API
  referral: {
    getAll: () => ipcRenderer.invoke('referral:getAll'),
    add: (data) => ipcRenderer.invoke('referral:add', data),
    update: (id, data) => ipcRenderer.invoke('referral:update', id, data),
    delete: (id) => ipcRenderer.invoke('referral:delete', id),
    getByPatient: (patientId) => ipcRenderer.invoke('referral:getByPatient', patientId),
    getRecentByDoctor: (doctorId, days) => ipcRenderer.invoke('referral:getRecentByDoctor', doctorId, days),
  },

  // Dashboard API
  dashboard: {
    getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    getRecentReferrals: () => ipcRenderer.invoke('dashboard:getRecentReferrals'),
    getTopDoctors: () => ipcRenderer.invoke('dashboard:getTopDoctors'),
  },

  bill: {
    getAll: () => ipcRenderer.invoke('bill:getAll'),
    add: (data) => ipcRenderer.invoke('bill:add', data),
    getById: (id) => ipcRenderer.invoke('bill:getById', id),
    update: (id, data) => ipcRenderer.invoke('bill:update', id, data),
    getByPatient: (patientId) => ipcRenderer.invoke('bill:getByPatient', patientId),
    delete: (id) => ipcRenderer.invoke('bill:delete', id),
  },

  // Product API
  product: {
    getAll: () => ipcRenderer.invoke('product:getAll'),
  },

  // Return API
  return: {
    add: (data) => ipcRenderer.invoke('return:add', data),
    getByBill: (billId) => ipcRenderer.invoke('return:getByBill', billId),
  },

  // Report API
  report: {
    getDoctorWise: (days) => ipcRenderer.invoke('report:getDoctorWise', days),
    getRevenue: (days) => ipcRenderer.invoke('report:getRevenue', days),
    getServiceWise: () => ipcRenderer.invoke('report:getServiceWise'),
    getReferralPayment: (days) => ipcRenderer.invoke('report:getReferralPayment', days),
  },

  // License API
  license: {
    validate: () => ipcRenderer.invoke('license:validate'),
  },
});
