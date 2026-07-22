export function isSuperAdmin(role?: string) {
  return role === "owner" || role === "super_admin";
}

export function isTenantAdmin(role?: string) {
  return role === "tenant_admin";
}
