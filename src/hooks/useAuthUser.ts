'use client';

import { useMemo, useCallback } from 'react';
import { useCurrentUser } from '@/store/api/auth';
import { IUser } from '@/types/model';

export type RoleName =
	| 'super admin'
	| 'superadmin'
	| 'developer'
	| 'administrator'
	| 'admin'
	| 'staff'
	| 'operator'
	| string;

export function useAuthUser() {
	const { data: user, isLoading, error, refetch } = useCurrentUser();

	const roleName: RoleName = (
		user?.role?.name ||
		user?.role_name ||
		''
	).toLowerCase().trim();

	const roleAlias = (
		user?.role?.alias ||
		user?.role_alias ||
		''
	).toLowerCase().trim();

	const roleId = user?.role?.id || user?.role_id;

	const isSuperAdmin =
		roleName.includes('super') ||
		roleAlias.includes('super') ||
		roleName === 'super admin' ||
		roleAlias === 'super-admin';

	const isDeveloper = roleName === 'developer' || roleAlias === 'developer';
	const isAdministrator =
		roleName === 'administrator' ||
		roleName === 'admin' ||
		roleAlias === 'admin' ||
		roleAlias === 'administrator';

	const isPrivileged = isSuperAdmin || isDeveloper;
	const isPrivilegedWithAdmin = isPrivileged || isAdministrator;

	const permissions: string[] = useMemo(() => {
		return user?.permissions || [];
	}, [user]);

	/**
	 * haveRoute checks whether the current user has permission to access a specific route or module name.
	 * Returns true if the user's role has this module/route checked (dicentang) in RBAC setup.
	 * Super Admin / Developer always returns true.
	 */
	const haveRoute = useCallback(
		(routeOrName: string): boolean => {
			if (!user) return false;
			if (isPrivileged) return true;
			if (!permissions || permissions.length === 0) return false;
			if (permissions.includes('*')) return true;

			if (!routeOrName) return false;

			const target = routeOrName.trim();
			const targetLower = target.toLowerCase();
			const normalizedTarget = target.startsWith('/') ? target : `/${target}`;

			return permissions.some((p: string) => {
				if (!p) return false;
				const pTrimmed = p.trim();
				const pLower = pTrimmed.toLowerCase();
				const normP = pTrimmed.startsWith('/') ? pTrimmed : `/${pTrimmed}`;

				// 1. Direct equality (case-insensitive name or route)
				if (pLower === targetLower || normP === normalizedTarget || pTrimmed === target) {
					return true;
				}

				// 2. Target is a parent module of a permitted child route
				// e.g. User has "/reports/cellular", checking haveRoute("/reports") -> true!
				if (normP.startsWith(normalizedTarget + '/')) {
					return true;
				}

				// 3. User has parent permission and checking child route
				// e.g. User has "/reports", checking haveRoute("/reports/cellular") -> true!
				if (normalizedTarget.startsWith(normP + '/')) {
					return true;
				}

				return false;
			});
		},
		[user, isPrivileged, permissions]
	);

	return {
		user: user as IUser | undefined,
		roleId,
		roleName,
		roleAlias,
		permissions,
		isLoading,
		error,
		refetch,
		isSuperAdmin,
		isDeveloper,
		isAdministrator,
		isPrivileged,
		isPrivilegedWithAdmin,
		haveRoute,
		canAccess: haveRoute,
	};
}

/**
 * useCanModules hook matching mini-erp API.
 * Allows checking module permissions for given module names or routes.
 */
export function useCanModules(moduleNamesOrRoutes?: string[]) {
	const { haveRoute, isPrivileged, isPrivilegedWithAdmin, isLoading, user } = useAuthUser();

	return {
		haveRoute,
		isLoadingHaveRoute: isLoading,
		user,
		isPrivileged,
		isPrivilegedWithAdmin,
	};
}

