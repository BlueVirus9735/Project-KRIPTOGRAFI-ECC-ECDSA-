// Role-Based Access Control Utilities
// PERUM_PERHUTANI - Sistem Pengelolaan RTT

export type UserRole = 'sysadmin' | 'admin' | 'kph' | 'phw' | 'divisi' | 'gis' | 'lapangan';

export interface User {
  id: number;
  username: string;
  nama: string;
  role: UserRole;
}

// Role hierarchy (higher number = more access)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  sysadmin: 100,
  admin: 80,
  kph: 60,
  phw: 60,
  divisi: 60,
  gis: 40,
  lapangan: 40,
};

// Permission definitions
export const PERMISSIONS = {
  // User Management
  USER_MANAGE: 'user_manage',
  SYSTEM_CONFIG: 'system_config',
  
  // Document Creation/Editing
  DOCUMENT_CREATE: 'document_create',
  DOCUMENT_EDIT: 'document_edit',
  DOCUMENT_DELETE: 'document_delete',
  
  // RTT Sections
  RTT_SUMMARY_EDIT: 'rtt_summary_edit',
  RTT_NETT_EDIT: 'rtt_nett_edit',
  PETA_LOKASI_EDIT: 'peta_lokasi_edit',
  PETA_BAP_EDIT: 'peta_bap_edit',
  KLEM_DAFTAR_EDIT: 'klem_daftar_edit',
  KLEM_REKAP_EDIT: 'klem_rekap_edit',
  BERITA_ACARA_EDIT: 'berita_acara_edit',
  
  // Workflow
  DOCUMENT_REVIEW: 'document_review',
  DOCUMENT_APPROVE_KPH: 'document_approve_kph',
  DOCUMENT_VERIFY_PHW: 'document_verify_phw',
  DOCUMENT_FINALIZE: 'document_finalize',
  
  // Viewing
  DASHBOARD_VIEW: 'dashboard_view',
  DOCUMENT_VIEW: 'document_view',
  RPKH_VIEW: 'rpkh_view',
  REPORT_VIEW: 'report_view',
  
  // Special
  PDF_GENERATE: 'pdf_generate',
  VALIDATION_VIEW: 'validation_view',
  ALL_ACCESS: 'all_access',
} as const;

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  sysadmin: [
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.ALL_ACCESS,
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_EDIT,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.RTT_SUMMARY_EDIT,
    PERMISSIONS.RTT_NETT_EDIT,
    PERMISSIONS.PETA_LOKASI_EDIT,
    PERMISSIONS.PETA_BAP_EDIT,
    PERMISSIONS.KLEM_DAFTAR_EDIT,
    PERMISSIONS.KLEM_REKAP_EDIT,
    PERMISSIONS.BERITA_ACARA_EDIT,
    PERMISSIONS.DOCUMENT_REVIEW,
    PERMISSIONS.DOCUMENT_APPROVE_KPH,
    PERMISSIONS.DOCUMENT_VERIFY_PHW,
    PERMISSIONS.DOCUMENT_FINALIZE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.RPKH_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.PDF_GENERATE,
    PERMISSIONS.VALIDATION_VIEW,
  ],
  
  admin: [
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_EDIT,
    PERMISSIONS.RTT_SUMMARY_EDIT,
    PERMISSIONS.RTT_NETT_EDIT,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.RPKH_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
  
  kph: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DOCUMENT_REVIEW,
    PERMISSIONS.DOCUMENT_APPROVE_KPH,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.RPKH_VIEW,
  ],
  
  phw: [
    PERMISSIONS.DOCUMENT_VERIFY_PHW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.RPKH_VIEW,
  ],
  
  divisi: [
    PERMISSIONS.DOCUMENT_FINALIZE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.PDF_GENERATE,
  ],
  
  gis: [
    PERMISSIONS.PETA_LOKASI_EDIT,
    PERMISSIONS.PETA_BAP_EDIT,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
  
  lapangan: [
    PERMISSIONS.KLEM_DAFTAR_EDIT,
    PERMISSIONS.KLEM_REKAP_EDIT,
    PERMISSIONS.BERITA_ACARA_EDIT,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
};

// Permission helper functions
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'sysadmin') return true; // Sysadmin has all permissions
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

// Role helper functions
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    sysadmin: 'Admin Sistem',
    admin: 'Staf Tata Usaha',
    kph: 'Kepala KPH',
    phw: 'Verifikator PHW',
    divisi: 'Divisi/Departemen',
    gis: 'Staf GIS/Perencanaan',
    lapangan: 'Staf Lapangan',
  };
  return displayNames[role] || role;
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    sysadmin: 'Mengelola user dan konfigurasi sistem',
    admin: 'Menginput RTT Summary dan NETT RTT',
    kph: 'Monitoring, review, dan approval dokumen',
    phw: 'Verifikasi teknis RTT terhadap RPKH',
    divisi: 'Pengesahan akhir dan generate PDF',
    gis: 'Menginput Peta Lokasi dan Peta BAP',
    lapangan: 'Menginput Daftar Klem, Rekap Klem, dan Berita Acara',
  };
  return descriptions[role] || '';
}

export function isSysadmin(user: User | null): boolean {
  return user?.role === 'sysadmin';
}

export function canEditSection(user: User | null, section: 'summary' | 'nett' | 'peta' | 'peta_bap' | 'klem' | 'berita_acara'): boolean {
  if (!user) return false;
  
  const permissionMap = {
    summary: PERMISSIONS.RTT_SUMMARY_EDIT,
    nett: PERMISSIONS.RTT_NETT_EDIT,
    peta: PERMISSIONS.PETA_LOKASI_EDIT,
    peta_bap: PERMISSIONS.PETA_BAP_EDIT,
    klem: PERMISSIONS.KLEM_DAFTAR_EDIT,
    berita_acara: PERMISSIONS.BERITA_ACARA_EDIT,
  };
  
  return hasPermission(user, permissionMap[section]);
}

export function canApprove(user: User | null, level: 'kph' | 'phw' | 'divisi'): boolean {
  if (!user) return false;
  
  const permissionMap = {
    kph: PERMISSIONS.DOCUMENT_APPROVE_KPH,
    phw: PERMISSIONS.DOCUMENT_VERIFY_PHW,
    divisi: PERMISSIONS.DOCUMENT_FINALIZE,
  };
  
  return hasPermission(user, permissionMap[level]);
}

// Menu visibility helpers
export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  requiredPermissions?: string[];
  requiredRoles?: UserRole[];
}

export function canAccessMenu(user: User | null, item: MenuItem): boolean {
  if (!user) return false;
  
  if (item.requiredRoles && !item.requiredRoles.includes(user.role)) {
    return false;
  }
  
  if (item.requiredPermissions && !hasAnyPermission(user, item.requiredPermissions)) {
    return false;
  }
  
  return true;
}

// Default passwords for new users (should be changed on first login)
export const DEFAULT_PASSWORD = 'password123';
