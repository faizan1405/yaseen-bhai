// =============================================================================
// Admin roles & granular permission catalogue (single source of truth).
//
// This module is framework-agnostic and safe to import from BOTH server code
// (API routes, server components, auth callbacks) and client code (sidebar,
// admin-users page). It contains NO secrets and performs NO I/O.
// =============================================================================

// Mirror of the Prisma `AdminRole` enum. Kept as a plain union so client bundles
// don't need to pull in the Prisma client.
export type AdminRole =
  | 'SUPER_ADMIN'
  | 'PROFILE_MANAGER'
  | 'VERIFICATION_MANAGER'
  | 'LEAD_MANAGER'
  | 'PAYMENT_MANAGER'
  | 'CONTENT_MANAGER'
  | 'SUPPORT_MANAGER';

export const ADMIN_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'PROFILE_MANAGER',
  'VERIFICATION_MANAGER',
  'LEAD_MANAGER',
  'PAYMENT_MANAGER',
  'CONTENT_MANAGER',
  'SUPPORT_MANAGER',
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROFILE_MANAGER: 'Profile Manager',
  VERIFICATION_MANAGER: 'Verification Manager',
  LEAD_MANAGER: 'Lead Manager',
  PAYMENT_MANAGER: 'Payment Manager',
  CONTENT_MANAGER: 'Content Manager',
  SUPPORT_MANAGER: 'Support Manager',
};

// --- Resources (protected admin areas) --------------------------------------
export type Resource =
  | 'dashboard'
  | 'profiles'
  | 'profileApproval'
  | 'photoApproval'
  | 'verification'
  | 'leads'
  | 'packages'
  | 'payments'
  | 'successStories'
  | 'contactEnquiries'
  | 'masterData'
  | 'settings'
  | 'referral'
  | 'reports'
  | 'adminUsers';

export const RESOURCE_LABELS: Record<Resource, string> = {
  dashboard: 'Dashboard',
  profiles: 'User Profiles',
  profileApproval: 'Profile Approval',
  photoApproval: 'Photo Approval',
  verification: 'Verification',
  leads: 'Leads',
  packages: 'Membership Packages',
  payments: 'Payments',
  successStories: 'Success Stories',
  contactEnquiries: 'Contact Enquiries',
  masterData: 'Master Data',
  settings: 'Website Settings',
  referral: 'Referral Settings',
  reports: 'Reports',
  adminUsers: 'Admin-User Management',
};

// --- Actions ----------------------------------------------------------------
export type Action =
  | 'view'
  | 'create'
  | 'edit'
  | 'approve'
  | 'reject'
  | 'delete'
  | 'export'
  | 'assign';

export const ACTIONS: Action[] = [
  'view', 'create', 'edit', 'approve', 'reject', 'delete', 'export', 'assign',
];

// A permission string is `${Resource}:${Action}`, e.g. "profiles:approve".
export type Permission = `${Resource}:${Action}`;

// Wildcard meaning "everything" — held only by Super Admin.
export const ALL_PERMISSIONS = '*' as const;

// Curated set of meaningful permissions per resource. This is the authoritative
// list the admin-users editor renders and the effective-permission logic checks
// membership against.
export const PERMISSION_CATALOGUE: Record<Resource, Action[]> = {
  dashboard: ['view'],
  profiles: ['view', 'edit', 'delete', 'export'],
  profileApproval: ['view', 'approve', 'reject'],
  photoApproval: ['view', 'approve', 'reject'],
  verification: ['view', 'edit', 'approve', 'reject', 'assign'],
  leads: ['view', 'create', 'edit', 'delete', 'assign', 'export'],
  packages: ['view', 'edit', 'assign'],
  payments: ['view', 'edit', 'export'],
  successStories: ['view', 'create', 'edit', 'delete'],
  contactEnquiries: ['view', 'edit', 'delete', 'export'],
  masterData: ['view', 'create', 'edit', 'delete'],
  settings: ['view', 'edit'],
  referral: ['view', 'edit'],
  reports: ['view', 'export'],
  adminUsers: ['view', 'create', 'edit', 'delete', 'assign'],
};

/** Every concrete permission string, e.g. ["dashboard:view", "profiles:view", ...]. */
export const ALL_PERMISSION_KEYS: Permission[] = (Object.keys(PERMISSION_CATALOGUE) as Resource[])
  .flatMap((resource) =>
    PERMISSION_CATALOGUE[resource].map((action) => `${resource}:${action}` as Permission)
  );

export function permissionsForResource(resource: Resource): Permission[] {
  return PERMISSION_CATALOGUE[resource].map((a) => `${resource}:${a}` as Permission);
}

function allActionsFor(...resources: Resource[]): Permission[] {
  return resources.flatMap((r) => permissionsForResource(r));
}

// --- Default permission set per role ----------------------------------------
// Super Admin is handled specially (implicit "*"), so it is intentionally not
// enumerated here. Every non-super role gets dashboard:view so it can load the
// overview.
export const ROLE_PERMISSIONS: Record<Exclude<AdminRole, 'SUPER_ADMIN'>, Permission[]> = {
  PROFILE_MANAGER: [
    'dashboard:view',
    ...allActionsFor('profiles', 'profileApproval', 'photoApproval'),
    'reports:view',
  ],
  VERIFICATION_MANAGER: [
    'dashboard:view',
    ...allActionsFor('verification'),
    'profiles:view',
    'profileApproval:view', 'profileApproval:approve', 'profileApproval:reject',
    'reports:view',
  ],
  LEAD_MANAGER: [
    'dashboard:view',
    ...allActionsFor('leads', 'contactEnquiries'),
    'profiles:view',
    'reports:view', 'reports:export',
  ],
  PAYMENT_MANAGER: [
    'dashboard:view',
    ...allActionsFor('payments', 'packages'),
    'profiles:view',
    'referral:view',
    'reports:view', 'reports:export',
  ],
  CONTENT_MANAGER: [
    'dashboard:view',
    ...allActionsFor('successStories', 'masterData'),
    'settings:view', 'settings:edit',
    'reports:view',
  ],
  SUPPORT_MANAGER: [
    'dashboard:view',
    'contactEnquiries:view', 'contactEnquiries:edit',
    'leads:view', 'leads:edit',
    'profiles:view',
    'verification:view',
  ],
};

/** Is this admin (by role) a super admin? Null role on an ADMIN => yes (legacy compat). */
export function isSuperAdminRole(adminRole: AdminRole | null | undefined): boolean {
  return adminRole == null || adminRole === 'SUPER_ADMIN';
}

export interface AdminPermissionInput {
  /** The coarse Auth.js role. Only "ADMIN" is ever an admin. */
  role?: string | null;
  adminRole?: AdminRole | null;
  /** Explicit override list. When non-empty it REPLACES the role defaults. */
  adminPermissions?: string[] | null;
  /** null/true => active, false => access revoked. */
  adminActive?: boolean | null;
}

/** An admin is active unless explicitly deactivated. */
export function isActiveAdmin(user: AdminPermissionInput): boolean {
  return user.role === 'ADMIN' && user.adminActive !== false;
}

/**
 * Resolve the effective permission list for an admin.
 * - Non-admin / inactive admin => [] (no permissions).
 * - Super Admin => ["*"] (everything).
 * - Explicit adminPermissions (non-empty) => used verbatim (full add/remove control).
 * - Otherwise => the role's default set.
 */
export function getEffectivePermissions(user: AdminPermissionInput): string[] {
  if (!isActiveAdmin(user)) return [];
  if (isSuperAdminRole(user.adminRole)) return [ALL_PERMISSIONS];

  const custom = (user.adminPermissions ?? []).filter(Boolean);
  if (custom.length > 0) return Array.from(new Set(custom));

  const role = user.adminRole as Exclude<AdminRole, 'SUPER_ADMIN'>;
  return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : ['dashboard:view'];
}

/**
 * Does the given effective-permission list satisfy the required permission?
 * Supports the "*" super wildcard and "resource:*" resource wildcards.
 */
export function permissionListAllows(permissions: string[], required: string): boolean {
  if (!required) return true;
  if (permissions.includes(ALL_PERMISSIONS)) return true;
  if (permissions.includes(required)) return true;
  const [resource] = required.split(':');
  return permissions.includes(`${resource}:*`);
}

/** Convenience: does this admin (raw fields) hold the required permission? */
export function hasPermission(user: AdminPermissionInput, required: string): boolean {
  return permissionListAllows(getEffectivePermissions(user), required);
}

// --- Sidebar / route → permission mapping -----------------------------------
// Single source of truth used by BOTH the server layout (URL protection) and the
// client sidebar (menu visibility). `perm` is the permission required to see /
// open the section.
export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  perm: Permission;
  section: 'Operations' | 'Content' | 'Logs & Settings' | 'Administration';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: '📊', perm: 'dashboard:view', section: 'Operations' },
  { href: '/admin/profiles', label: 'Profiles', icon: '🧑‍🤝‍🧑', perm: 'profiles:view', section: 'Operations' },
  { href: '/admin/verification', label: 'Verification Queue', icon: '👤', perm: 'verification:view', section: 'Operations' },
  { href: '/admin/packages', label: 'Premium Packages', icon: '💎', perm: 'payments:view', section: 'Operations' },
  { href: '/admin/leads', label: 'Leads & Inquiries', icon: '📥', perm: 'leads:view', section: 'Operations' },
  { href: '/admin/events', label: 'Event Management', icon: '🎊', perm: 'leads:view', section: 'Content' },
  { href: '/admin/master-data', label: 'Master Data', icon: '🛠️', perm: 'masterData:view', section: 'Content' },
  { href: '/admin/success-stories', label: 'Success Stories', icon: '💍', perm: 'successStories:view', section: 'Content' },
  { href: '/admin/logs', label: 'Activity Logs', icon: '📜', perm: 'reports:view', section: 'Logs & Settings' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️', perm: 'settings:view', section: 'Logs & Settings' },
  { href: '/admin/admin-users', label: 'Admin Users', icon: '🛡️', perm: 'adminUsers:view', section: 'Administration' },
];

/**
 * Map a pathname to the permission required to view that admin page.
 * Returns null for paths that need only a valid admin session (e.g. /admin/login).
 * Longest matching prefix wins so nested routes inherit their section's gate.
 */
export function requiredPermissionForPath(pathname: string): Permission | null {
  if (pathname === '/admin/login') return null;
  // Exact overview match first (so it doesn't get caught as a prefix of others).
  if (pathname === '/admin') return 'dashboard:view';

  const match = ADMIN_NAV_ITEMS
    .filter((item) => item.href !== '/admin' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match ? match.perm : 'dashboard:view';
}
