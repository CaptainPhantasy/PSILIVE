import type { SafeUser } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export const ADMIN_ROLES = ["ADMIN", "OWNER", "SUPER_ADMIN"] as const satisfies readonly UserRole[];
export const FIELD_OPERATOR_ROLES = ["TECHNICIAN", "ADMIN", "OWNER", "SUPER_ADMIN"] as const satisfies readonly UserRole[];

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
	return role != null && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isFieldOperatorRole(role: UserRole | string | null | undefined): boolean {
	return role != null && (FIELD_OPERATOR_ROLES as readonly string[]).includes(role);
}

export function canManageJobs(user: SafeUser | null): boolean {
	return isAdminRole(user?.role);
}

export function canEnterInspectionData(user: SafeUser | null, technicianId: string): boolean {
	if (!user) return false;
	if (isAdminRole(user.role)) return true;
	return isFieldOperatorRole(user.role) && user.id === technicianId;
}
