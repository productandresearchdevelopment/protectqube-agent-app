'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	Shield,
	Users as UsersIcon,
	Check,
	Loader2,
	KeyRound,
	SlidersHorizontal,
	ChevronDown,
	ChevronRight,
	ChevronsUpDown,
	Boxes,
	LayoutDashboard,
	Cpu,
	Radio,
	Video,
	FileText,
	Settings,
	Layers,
	Network,
	Bell,
	Database,
	Terminal,
	Folder,
	FolderTree,
} from 'lucide-react';
import { IRole } from '@/types/model';
import {
	useRoles,
	useDeleteRole,
	useRolePermissions,
	useUpdateSinglePermission,
	useUpdateRolePermissions,
	IRoleModulePermission,
} from '@/store/api/system';
import { RoleFormModal } from './RoleFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export const RolesTab: React.FC = () => {
	const [activeSubTab, setActiveSubTab] = useState<'roles' | 'permissions'>('roles');
	const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<IRole | null>(null);
	const [searchRole, setSearchRole] = useState('');
	const [searchModule, setSearchModule] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<IRole | null>(null);
	const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; role: IRole | null }>({
		isOpen: false,
		role: null,
	});

	const { data: roles = [], isLoading: isLoadingRoles } = useRoles({
		search: searchRole.trim() || undefined,
	});

	const activePermissionRole = selectedRoleForPermission || roles[0] || null;

	const { data: permissions = [], isLoading: isLoadingPerms } = useRolePermissions(
		activePermissionRole?.id
	);

	const deleteMutation = useDeleteRole();
	const updateSinglePermissionMutation = useUpdateSinglePermission();
	const updateBatchPermissionMutation = useUpdateRolePermissions();

	const isSavingPerm =
		updateSinglePermissionMutation.isPending || updateBatchPermissionMutation.isPending;

	const handleOpenCreate = () => {
		setEditingRole(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (role: IRole) => {
		setEditingRole(role);
		setIsModalOpen(true);
	};

	const handleSelectRoleForPermission = (role: IRole) => {
		setSelectedRoleForPermission(role);
		setActiveSubTab('permissions');
	};

	const handleConfirmDelete = async () => {
		if (!deleteDialog.role?.id) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.role.id);
			toast.success(`Role '${deleteDialog.role.name}' has been deleted`);
			setDeleteDialog({ isOpen: false, role: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete role');
		}
	};

	const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set());

	// Auto-expand all parent permissions initially
	useEffect(() => {
		if (permissions.length > 0) {
			const parentIds = new Set<number>();
			permissions.forEach((p) => {
				if (p.parent_id) parentIds.add(p.parent_id);
			});
			setExpandedModuleIds((prev) => {
				const next = new Set(prev);
				parentIds.forEach((id) => next.add(id));
				return next;
			});
		}
	}, [permissions]);

	// Auto-expand on search
	useEffect(() => {
		if (searchModule.trim()) {
			const term = searchModule.toLowerCase().trim();
			const toExpand = new Set<number>();
			permissions.forEach((p) => {
				const matches =
					p.name.toLowerCase().includes(term) ||
					(p.route && p.route.toLowerCase().includes(term)) ||
					(p.description && p.description.toLowerCase().includes(term));
				if (matches && p.parent_id) {
					toExpand.add(p.parent_id);
				}
			});
			setExpandedModuleIds((prev) => new Set([...prev, ...toExpand]));
		}
	}, [searchModule, permissions]);

	const toggleExpand = (id: number) => {
		setExpandedModuleIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const toggleExpandAll = () => {
		const parentIds = new Set<number>();
		permissions.forEach((p) => {
			if (p.parent_id) parentIds.add(p.parent_id);
		});

		if (expandedModuleIds.size >= parentIds.size && parentIds.size > 0) {
			setExpandedModuleIds(new Set());
		} else {
			setExpandedModuleIds(parentIds);
		}
	};

	const getChildren = (parentId: number) => {
		return permissions.filter((p) => p.parent_id === parentId);
	};

	const getAllDescendantPerms = (parentId: number): IRoleModulePermission[] => {
		const children = getChildren(parentId);
		let all = [...children];
		children.forEach((c) => {
			all = all.concat(getAllDescendantPerms(c.module_id));
		});
		return all;
	};

	const rootPermissions = useMemo(() => {
		return permissions.filter(
			(p) => !p.parent_id || !permissions.some((other) => other.module_id === p.parent_id)
		);
	}, [permissions]);

	const handleTogglePermission = async (perm: IRoleModulePermission) => {
		if (!activePermissionRole?.id || isSavingPerm) return;

		const children = getAllDescendantPerms(perm.module_id);
		const targetChecked = !perm.checked;

		try {
			if (children.length > 0) {
				// Cascading toggle for parent and descendants
				const batch = [
					{ module_id: perm.module_id, checked: targetChecked },
					...children.map((c) => ({ module_id: c.module_id, checked: targetChecked })),
				];
				await updateBatchPermissionMutation.mutateAsync({
					roleId: activePermissionRole.id,
					permissions: batch,
				});
			} else {
				await updateSinglePermissionMutation.mutateAsync({
					roleId: activePermissionRole.id,
					moduleId: perm.module_id,
					checked: targetChecked,
				});
			}
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to update permission');
		}
	};

	const handleToggleAllPermissions = async (checked: boolean) => {
		if (!activePermissionRole?.id || isSavingPerm || permissions.length === 0) return;
		try {
			const batch = permissions.map((p) => ({
				module_id: p.module_id,
				checked,
			}));
			await updateBatchPermissionMutation.mutateAsync({
				roleId: activePermissionRole.id,
				permissions: batch,
			});
			toast.success(checked ? 'All modules enabled for this role' : 'All modules disabled');
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to update permissions');
		}
	};

	const resolvePermIcon = (name?: string | null, iconName?: string | null, typeName?: string | null) => {
		const n = (name || '').toLowerCase();
		const i = (iconName || '').toLowerCase();
		const t = (typeName || '').toLowerCase();

		if (i.includes('dashboard') || n.includes('overview')) return LayoutDashboard;
		if (i.includes('cpu') || n.includes('health') || i.includes('activity')) return Cpu;
		if (i.includes('radio') || n.includes('cellular')) return Radio;
		if (i.includes('video') || n.includes('dvr')) return Video;
		if (i.includes('file') || n.includes('report')) return FileText;
		if (i.includes('user') || n.includes('user')) return UsersIcon;
		if (i.includes('shield') || n.includes('role')) return Shield;
		if (i.includes('layer') || n.includes('module')) return Layers;
		if (i.includes('network') || n.includes('integration')) return Network;
		if (i.includes('bell') || n.includes('notif')) return Bell;
		if (i.includes('database') || n.includes('database')) return Database;
		if (i.includes('setting') || n.includes('config')) return Settings;
		if (t.includes('directory')) return Folder;
		if (t.includes('service')) return Terminal;
		return FolderTree;
	};

	const filteredPermissions = useMemo(() => {
		if (!searchModule.trim()) return permissions;
		const term = searchModule.toLowerCase().trim();
		return permissions.filter(
			(p) =>
				p.name.toLowerCase().includes(term) ||
				(p.route && p.route.toLowerCase().includes(term)) ||
				(p.module_type_name && p.module_type_name.toLowerCase().includes(term))
		);
	}, [permissions, searchModule]);

	const checkedCount = permissions.filter((p) => p.checked).length;
	const allChecked = permissions.length > 0 && checkedCount === permissions.length;

	const renderPermissionRowsRecursive = (
		parentId: number | null,
		level: number = 0
	): React.JSX.Element[] => {
		const currentList = parentId === null ? rootPermissions : getChildren(parentId);

		// If searching, filter current list or check descendants
		const displayedList = searchModule.trim()
			? currentList.filter((item) => {
					const term = searchModule.toLowerCase().trim();
					const match =
						item.name.toLowerCase().includes(term) ||
						(item.route && item.route.toLowerCase().includes(term)) ||
						(item.description && item.description.toLowerCase().includes(term));
					if (match) return true;
					const descendants = getAllDescendantPerms(item.module_id);
					return descendants.some(
						(d) =>
							d.name.toLowerCase().includes(term) ||
							(d.route && d.route.toLowerCase().includes(term)) ||
							(d.description && d.description.toLowerCase().includes(term))
					);
			  })
			: currentList;

		return displayedList.flatMap((perm) => {
			const children = getChildren(perm.module_id);
			const hasChildren = children.length > 0;
			const isExpanded = expandedModuleIds.has(perm.module_id);
			const isChecked = perm.checked;
			const typeName = perm.module_type_name || 'route menu';
			const isServiceApi = typeName.toLowerCase().includes('service');
			const IconComponent = resolvePermIcon(perm.name, perm.icon, typeName);

			const rowElement = (
				<tr
					key={perm.module_id}
					onClick={() => handleTogglePermission(perm)}
					className={`group transition-colors border-b border-slate-100 dark:border-slate-800/80 cursor-pointer select-none ${
						isChecked
							? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
							: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
					}`}
				>
					{/* Column 1: Indentation, Chevron & Checkbox */}
					<td className='py-3.5 pl-4 pr-2 whitespace-nowrap align-middle w-16'>
						<div
							style={{ paddingLeft: `${level * 24}px` }}
							className={`flex items-center ${hasChildren ? 'gap-2' : 'justify-end gap-2'}`}
						>
							{hasChildren ? (
								<button
									type='button'
									onClick={(e) => {
										e.stopPropagation();
										toggleExpand(perm.module_id);
									}}
									className='p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer'
									title={isExpanded ? 'Collapse' : 'Expand'}
								>
									{isExpanded ? (
										<ChevronDown className='w-4 h-4 text-slate-600 dark:text-slate-300' />
									) : (
										<ChevronRight className='w-4 h-4 text-slate-400' />
									)}
								</button>
							) : (
								<div className='w-6 h-6 shrink-0' />
							)}

							<div
								className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
									isChecked
										? 'bg-[#0073ea] border-[#0073ea] text-white shadow-xs'
										: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
								}`}
							>
								{isChecked && <Check className='w-3.5 h-3.5 stroke-[3]' />}
							</div>
						</div>
					</td>

					{/* Column 2: Module Name & Description + Icon */}
					<td className='py-3.5 px-4 align-middle'>
						<div className='flex items-center gap-3.5'>
							{!isServiceApi && (
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 ${
										isChecked
											? 'bg-gradient-to-br from-[#0073ea] to-[#005bb5]'
											: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
									}`}
								>
									<IconComponent className='w-5 h-5' />
								</div>
							)}
							<div className='min-w-0'>
								<div className='flex items-center gap-2'>
									<span className='font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm'>
										{perm.name}
									</span>
									{hasChildren && (
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0073ea] dark:text-[#3894ff] border border-blue-200/60 dark:border-blue-800/60'>
											{children.filter((c) => c.checked).length} / {children.length}
										</span>
									)}
								</div>
								{perm.description && (
									<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md'>
										{perm.description}
									</p>
								)}
							</div>
						</div>
					</td>

					{/* Column 3: Module Type (Uppercase outline pill badge) */}
					<td className='py-3.5 px-4 align-middle whitespace-nowrap'>
						<span className='inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 shadow-2xs'>
							{typeName.toUpperCase()}
						</span>
					</td>

					{/* Column 4: Route */}
					<td className='py-3.5 px-4 align-middle whitespace-nowrap'>
						{perm.route ? (
							<code className='inline-flex items-center px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'>
								{perm.route}
							</code>
						) : null}
					</td>

					{/* Column 5: Status */}
					<td className='py-3.5 px-4 align-middle text-right whitespace-nowrap'>
						<span
							className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
								isChecked
									? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
									: 'bg-slate-100 dark:bg-slate-800 text-slate-400'
							}`}
						>
							{isChecked ? 'Permitted' : 'Restricted'}
						</span>
					</td>
				</tr>
			);

			const elements: React.JSX.Element[] = [rowElement];

			if (hasChildren && isExpanded) {
				elements.push(...renderPermissionRowsRecursive(perm.module_id, level + 1));
			}

			return elements;
		});
	};

	return (
		<div className='space-y-6'>
			{/* Top Bar */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5'>
				<div>
					<h2 className='text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
						Roles & Permissions
					</h2>
					<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
						Define authorization levels, operational roles, and module access matrix
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{activeSubTab === 'roles' && (
						<button
							onClick={handleOpenCreate}
							className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
						>
							<Plus className='w-4 h-4' />
							<span>New Role</span>
						</button>
					)}
				</div>
			</div>

			{/* Sub Tabs */}
			<div className='flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800'>
				<div className='flex items-center gap-6'>
					<button
						onClick={() => setActiveSubTab('roles')}
						className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all relative cursor-pointer ${
							activeSubTab === 'roles'
								? 'text-[#0073ea] dark:text-[#3894ff]'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
						}`}
					>
						<SlidersHorizontal className='w-4 h-4' />
						<span>Roles ({roles.length})</span>
						{activeSubTab === 'roles' && (
							<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#0073ea] rounded-full' />
						)}
					</button>

					<button
						onClick={() => setActiveSubTab('permissions')}
						className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all relative cursor-pointer ${
							activeSubTab === 'permissions'
								? 'text-[#0073ea] dark:text-[#3894ff]'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
						}`}
					>
						<KeyRound className='w-4 h-4' />
						<span>Permissions Matrix</span>
						{activeSubTab === 'permissions' && (
							<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#0073ea] rounded-full' />
						)}
					</button>
				</div>
			</div>

			{/* ==================================================================== */}
			{/* ROLES LIST TAB */}
			{/* ==================================================================== */}
			{activeSubTab === 'roles' && (
				<div className='space-y-4'>
					<div className='flex items-center justify-between gap-3 bg-white dark:bg-[#121c2f] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
						<div className='relative flex-1 max-w-md'>
							<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
							<input
								type='text'
								value={searchRole}
								onChange={(e) => setSearchRole(e.target.value)}
								placeholder='Search roles...'
								className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>
					</div>

					<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-xs'>
								<thead className='bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
									<tr>
										<th className='px-5 py-3.5'>Role Name</th>
										<th className='px-5 py-3.5'>Alias</th>
										<th className='px-5 py-3.5'>Assigned Users</th>
										<th className='px-5 py-3.5'>Description</th>
										<th className='px-5 py-3.5 text-right'>Actions</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
									{isLoadingRoles ? (
										Array.from({ length: 3 }).map((_, i) => (
											<tr key={i} className='animate-pulse'>
												<td className='px-5 py-4'>
													<div className='flex items-center gap-3'>
														<div className='w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800' />
														<div className='w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
													</div>
												</td>
												<td className='px-5 py-4'>
													<div className='w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full' />
												</td>
												<td className='px-5 py-4'>
													<div className='w-10 h-4 bg-slate-200 dark:bg-slate-800 rounded' />
												</td>
												<td className='px-5 py-4'>
													<div className='w-48 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
												</td>
												<td className='px-5 py-4 text-right'>
													<div className='w-14 h-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto' />
												</td>
											</tr>
										))
									) : roles.length === 0 ? (
										<tr>
											<td colSpan={5} className='px-5 py-12 text-center text-slate-400'>
												No roles found.
											</td>
										</tr>
									) : (
										roles.map((r) => {
											const color = r.color || '#3b82f6';
											const isSuper =
												r.name.toLowerCase().includes('super') ||
												r.alias.toLowerCase().includes('super');

											return (
												<tr
													key={r.id}
													className='hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors'
												>
													<td className='px-5 py-4'>
														<div className='flex items-center gap-3'>
															<div
																className='w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0'
																style={{ backgroundColor: color }}
															>
																{r.name.charAt(0).toUpperCase()}
															</div>
															<span className='font-bold text-slate-900 dark:text-slate-100'>
																{r.name}
															</span>
														</div>
													</td>

													<td className='px-5 py-4'>
														<span
															className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border'
															style={{
																backgroundColor: `${color}15`,
																borderColor: `${color}30`,
																color: color,
															}}
														>
															{r.alias.toUpperCase()}
														</span>
													</td>

													<td className='px-5 py-4 text-slate-600 dark:text-slate-300'>
														<div className='flex items-center gap-1.5'>
															<UsersIcon className='w-3.5 h-3.5 text-slate-400' />
															<span>{r.user_count || 0} user(s)</span>
														</div>
													</td>

													<td className='px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate'>
														{r.description || '-'}
													</td>

													<td className='px-5 py-4 text-right'>
														<div className='flex items-center justify-end gap-1.5'>
															<button
																onClick={() => handleSelectRoleForPermission(r)}
																className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#0073ea] dark:text-[#3894ff] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer text-xs font-semibold'
																title='Manage Permissions'
															>
																<Shield className='w-3.5 h-3.5' />
																<span>Permissions</span>
															</button>
															<button
																onClick={() => handleOpenEdit(r)}
																className='p-1.5 rounded-lg text-slate-500 hover:text-[#0073ea] dark:hover:text-[#3894ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
																title='Edit Role'
															>
																<Pencil className='w-3.5 h-3.5' />
															</button>
															<button
																onClick={() => setDeleteDialog({ isOpen: true, role: r })}
																disabled={isSuper}
																className='p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none'
																title='Delete Role'
															>
																<Trash2 className='w-3.5 h-3.5' />
															</button>
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* ==================================================================== */}
			{/* PERMISSIONS MATRIX TAB */}
			{/* ==================================================================== */}
			{activeSubTab === 'permissions' && (
				<div className='space-y-4'>
					{/* Active Role Selector Card */}
					<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#121c2f] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
						<div className='flex items-center gap-3'>
							<div
								className='w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs shrink-0'
								style={{ backgroundColor: activePermissionRole?.color || '#3b82f6' }}
							>
								{activePermissionRole?.name?.charAt(0).toUpperCase()}
							</div>
							<div>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-bold text-slate-900 dark:text-white'>
										{activePermissionRole?.name}
									</span>
									<span
										className='text-[10px] px-2 py-0.5 rounded-full font-bold border'
										style={{
											backgroundColor: `${activePermissionRole?.color || '#3b82f6'}15`,
											borderColor: `${activePermissionRole?.color || '#3b82f6'}30`,
											color: activePermissionRole?.color || '#3b82f6',
										}}
									>
										{activePermissionRole?.alias.toUpperCase()}
									</span>
								</div>
								<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
									{checkedCount} of {permissions.length} modules permitted
								</p>
							</div>
						</div>

						<div className='flex items-center gap-3'>
							{isSavingPerm && (
								<div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[#0073ea] dark:text-[#3894ff] text-xs font-semibold animate-pulse'>
									<Loader2 className='w-3.5 h-3.5 animate-spin' />
									<span>Saving...</span>
								</div>
							)}

							<div className='relative'>
								<select
									value={activePermissionRole?.id || ''}
									onChange={(e) => {
										const r = roles.find((item) => item.id === e.target.value);
										if (r) setSelectedRoleForPermission(r);
									}}
									className='pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea]'
								>
									{roles.map((r) => (
										<option key={r.id} value={r.id}>
											Role: {r.name}
										</option>
									))}
								</select>
								<ChevronDown className='w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
							</div>

							<button
								type='button'
								onClick={() => handleToggleAllPermissions(!allChecked)}
								disabled={isSavingPerm}
								className='px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50'
							>
								{allChecked ? 'Uncheck All' : 'Check All'}
							</button>
						</div>
					</div>

					{/* Search modules */}
					<div className='relative max-w-md'>
						<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
						<input
							type='text'
							value={searchModule}
							onChange={(e) => setSearchModule(e.target.value)}
							placeholder='Filter modules by name, route, or category...'
							className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
						/>
					</div>

					{/* Matrix Tree Table */}
					<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
						{isLoadingPerms ? (
							<div className='p-6 space-y-3'>
								{Array.from({ length: 5 }).map((_, i) => (
									<div key={i} className='h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse' />
								))}
							</div>
						) : permissions.length === 0 ? (
							<div className='p-12 text-center text-slate-400 text-xs'>
								No modules found matching your search.
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full text-left border-collapse'>
									<thead>
										<tr className='border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wider uppercase bg-slate-50/60 dark:bg-slate-800/40'>
											<th className='py-3.5 pl-4 pr-2 w-16 text-right'>
												<button
													type='button'
													onClick={toggleExpandAll}
													className='p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center justify-center'
													title='Expand / Collapse All'
												>
													<ChevronsUpDown className='w-4 h-4' />
												</button>
											</th>
											<th className='py-3.5 px-4'>Module Name</th>
											<th className='py-3.5 px-4'>Type</th>
											<th className='py-3.5 px-4'>Route</th>
											<th className='py-3.5 px-4 text-right'>Permission Status</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80 text-xs'>
										{renderPermissionRowsRecursive(null, 0)}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Modals */}
			<RoleFormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				role={editingRole}
			/>

			<ConfirmDialog
				isOpen={deleteDialog.isOpen}
				title='Delete Role'
				description={`Are you sure you want to delete role "${deleteDialog.role?.name}"? Make sure no active users depend on this role.`}
				confirmLabel='Delete Role'
				variant='danger'
				isLoading={deleteMutation.isPending}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteDialog({ isOpen: false, role: null })}
			/>
		</div>
	);
};

