export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
}

const ROLE_ALIASES = {
  'Super Admin': ROLES.SUPER_ADMIN,
  superadmin: ROLES.SUPER_ADMIN,
  super_admin: ROLES.SUPER_ADMIN,
  Admin: ROLES.ADMIN,
  admin: ROLES.ADMIN,
  Receptionist: ROLES.USER,
  Doctor: ROLES.USER,
  Accountant: ROLES.USER,
  user: ROLES.USER,
}

export function normalizeRole(role) {
  return ROLE_ALIASES[role] || role || ROLES.USER
}

export function isAdminRole(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ROLES.SUPER_ADMIN || normalizedRole === ROLES.ADMIN
}

export function getDefaultRouteForRole(role) {
  return isAdminRole(role) ? '/admin/dashboard' : '/user/dashboard'
}
