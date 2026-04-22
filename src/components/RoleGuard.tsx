"use client";

import { ReactNode } from "react";
import { hasPermission, hasAnyPermission, type UserRole, PERMISSIONS } from "@/lib/auth";
import { useAuth } from "./DashboardLayout";

interface RoleGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  allowedRoles?: UserRole[];
  requireAll?: boolean; // If true, require all permissions. If false, require any.
  fallback?: ReactNode; // Component to show if not authorized
}

/**
 * RoleGuard - Component for conditional rendering based on user role/permissions
 * 
 * Usage:
 * <RoleGuard permission={PERMISSIONS.RTT_SUMMARY_EDIT}>
 *   <RTTSummaryForm />
 * </RoleGuard>
 * 
 * <RoleGuard permissions={[PERMISSIONS.DOCUMENT_REVIEW, PERMISSIONS.DOCUMENT_APPROVE_KPH]}>
 *   <ReviewPanel />
 * </RoleGuard>
 * 
 * <RoleGuard allowedRoles={['sysadmin', 'kph']}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export default function RoleGuard({ 
  children, 
  permission,
  permissions,
  allowedRoles,
  requireAll = false,
  fallback = null
}: RoleGuardProps) {
  const { user } = useAuth();

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user?.role as UserRole)) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAnyPermission(user, permissions) // At least one
      : hasAnyPermission(user, permissions); // Any of them
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Section-specific guards for RTT form
interface RTTSectionGuardProps {
  children: ReactNode;
  section: 'summary' | 'nett' | 'peta' | 'peta_bap' | 'klem_daftar' | 'klem_rekap' | 'berita_acara';
  fallback?: ReactNode;
}

/**
 * RTTSectionGuard - Guard for specific RTT document sections
 */
export function RTTSectionGuard({ children, section, fallback = null }: RTTSectionGuardProps) {
  const permissionMap = {
    summary: PERMISSIONS.RTT_SUMMARY_EDIT,
    nett: PERMISSIONS.RTT_NETT_EDIT,
    peta: PERMISSIONS.PETA_LOKASI_EDIT,
    peta_bap: PERMISSIONS.PETA_BAP_EDIT,
    klem_daftar: PERMISSIONS.KLEM_DAFTAR_EDIT,
    klem_rekap: PERMISSIONS.KLEM_REKAP_EDIT,
    berita_acara: PERMISSIONS.BERITA_ACARA_EDIT,
  };

  return (
    <RoleGuard permission={permissionMap[section]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Workflow action guards
interface WorkflowGuardProps {
  children: ReactNode;
  action: 'review' | 'approve_kph' | 'verify_phw' | 'finalize';
  fallback?: ReactNode;
}

/**
 * WorkflowGuard - Guard for workflow actions
 */
export function WorkflowGuard({ children, action, fallback = null }: WorkflowGuardProps) {
  const permissionMap = {
    review: PERMISSIONS.DOCUMENT_REVIEW,
    approve_kph: PERMISSIONS.DOCUMENT_APPROVE_KPH,
    verify_phw: PERMISSIONS.DOCUMENT_VERIFY_PHW,
    finalize: PERMISSIONS.DOCUMENT_FINALIZE,
  };

  return (
    <RoleGuard permission={permissionMap[action]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Read-only view for other sections
interface ReadOnlyGuardProps {
  children: ReactNode;
  editPermission: string;
  readPermission: string;
  isEditing?: boolean;
  readOnlyView?: ReactNode;
}

/**
 * ReadOnlyGuard - Shows edit view if user has edit permission, otherwise shows read-only view
 */
export function ReadOnlyGuard({ 
  children, 
  editPermission,
  readPermission,
  isEditing = true,
  readOnlyView
}: ReadOnlyGuardProps) {
  const { user } = useAuth();
  const canEdit = hasPermission(user, editPermission);
  const canRead = hasPermission(user, readPermission);

  if (canEdit && isEditing) {
    return <>{children}</>;
  }

  if (canRead && readOnlyView) {
    return <>{readOnlyView}</>;
  }

  return null;
}

// Admin-only guard
interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SysAdminGuard({ children, fallback = null }: AdminGuardProps) {
  return (
    <RoleGuard allowedRoles={['sysadmin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Multi-role guard with OR logic
interface MultiRoleGuardProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function MultiRoleGuard({ children, roles, fallback = null }: MultiRoleGuardProps) {
  return (
    <RoleGuard allowedRoles={roles} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
