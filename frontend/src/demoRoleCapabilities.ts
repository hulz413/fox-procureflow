export const ADMIN_ROLE_ID = 'role-admin'
export const APPLICANT_ROLE_ID = 'role-applicant'
export const APPROVER_ROLE_ID = 'role-approver'
export const DEMO_OPERATOR_ROLE_ID = 'role-demo-operator'
export const FINANCE_ROLE_ID = 'role-finance'
export const PROCUREMENT_ROLE_ID = 'role-procurement'
export const WAREHOUSE_ROLE_ID = 'role-warehouse'
export const DASHBOARD_VIEWER_ROLE_IDS = [ADMIN_ROLE_ID, PROCUREMENT_ROLE_ID, FINANCE_ROLE_ID]

type RoleBearingUser = {
  roles: Array<{ roleId: string }>
}

export function demoUserHasExactRole(user: RoleBearingUser | undefined, roleIds: string[]) {
  return user?.roles.some((role) => roleIds.includes(role.roleId)) ?? false
}

export function demoUserHasRoleCapability(user: RoleBearingUser | undefined, roleIds: string[]) {
  return demoUserHasExactRole(user, [ADMIN_ROLE_ID, ...roleIds])
}

export function demoUserCanViewDashboard(user: RoleBearingUser | undefined) {
  return demoUserHasExactRole(user, DASHBOARD_VIEWER_ROLE_IDS)
}

export function canDemoPersonaUsePrimaryAction(
  personaKey: string,
  route: {
    isDashboardRoute: boolean
    isPurchaseOrderRoute: boolean
    isPurchaseRequestRoute: boolean
    isReceiptInvoiceRoute: boolean
    isRfqRoute: boolean
  },
) {
  if (personaKey === 'admin') {
    return (
      route.isDashboardRoute ||
      route.isPurchaseOrderRoute ||
      route.isPurchaseRequestRoute ||
      route.isReceiptInvoiceRoute ||
      route.isRfqRoute
    )
  }

  return (
    (personaKey === 'applicant' && route.isPurchaseRequestRoute) ||
    (personaKey === 'procurement' && (route.isRfqRoute || route.isPurchaseOrderRoute)) ||
    (personaKey === 'warehouse' && route.isReceiptInvoiceRoute) ||
    (personaKey === 'finance' && route.isReceiptInvoiceRoute)
  )
}
