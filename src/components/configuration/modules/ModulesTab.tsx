'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	Layers,
	Grid,
	FolderTree,
	ChevronDown,
	ChevronRight,
	FolderPlus,
	ChevronsUpDown,
	MoreVertical,
	Folder,
	Terminal,
	LayoutDashboard,
	Cpu,
	Radio,
	Video,
	FileText,
	Settings,
	Users,
	Shield,
	Bell,
	Network,
	Database,
} from 'lucide-react';
import { IModule } from '@/types/model';
import {
	useModules,
	useModuleTypes,
	useDeleteModule,
	useDeleteModuleType,
	IModuleType,
} from '@/store/api/system';
import { ModuleFormModal } from './ModuleFormModal';
import { ModuleTypeFormModal } from './ModuleTypeFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export const ModulesTab: React.FC = () => {
	const [activeSubTab, setActiveSubTab] = useState<'module' | 'type'>('module');
	const [searchModule, setSearchModule] = useState('');
	const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
	const [editingModule, setEditingModule] = useState<(IModule & { parent_name?: string | null }) | null>(null);
	const [parentForNewSubmodule, setParentForNewSubmodule] = useState<number | null>(null);

	const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set());
	const [selectedModuleIds, setSelectedModuleIds] = useState<Set<number>>(new Set());
	const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

	const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
	const [editingType, setEditingType] = useState<IModuleType | null>(null);

	const [deleteModuleDialog, setDeleteModuleDialog] = useState<{ isOpen: boolean; module: IModule | null }>({
		isOpen: false,
		module: null,
	});

	const [deleteTypeDialog, setDeleteTypeDialog] = useState<{ isOpen: boolean; type: IModuleType | null }>({
		isOpen: false,
		type: null,
	});

	const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

	const { data: modules = [], isLoading: isLoadingModules } = useModules({
		search: searchModule.trim() || undefined,
	});

	const { data: moduleTypes = [], isLoading: isLoadingTypes } = useModuleTypes();

	const deleteModuleMutation = useDeleteModule();
	const deleteTypeMutation = useDeleteModuleType();

	// Auto-expand all parent modules initially
	useEffect(() => {
		if (modules.length > 0) {
			const parentIds = new Set<number>();
			modules.forEach((m) => {
				const pid = m.parent_id ?? m.parentId;
				if (pid) parentIds.add(pid);
			});
			setExpandedModuleIds((prev) => {
				const next = new Set(prev);
				parentIds.forEach((id) => next.add(id));
				return next;
			});
		}
	}, [modules]);

	// Auto-expand parents if matching children in search
	useEffect(() => {
		if (searchModule.trim()) {
			const term = searchModule.toLowerCase().trim();
			const toExpand = new Set<number>();
			modules.forEach((m) => {
				const matches =
					m.name.toLowerCase().includes(term) ||
					(m.route && m.route.toLowerCase().includes(term)) ||
					(m.description && m.description.toLowerCase().includes(term));
				if (matches) {
					const pid = m.parent_id ?? m.parentId;
					if (pid) toExpand.add(pid);
				}
			});
			setExpandedModuleIds((prev) => new Set([...prev, ...toExpand]));
		}
	}, [searchModule, modules]);

	// Filter root modules (level 0)
	const rootModules = useMemo(() => {
		return modules.filter((m) => {
			const pid = m.parent_id ?? m.parentId;
			return !pid || !modules.some((other) => other.id === pid);
		});
	}, [modules]);

	const getDirectChildren = (parentId: number) => {
		return modules.filter((m) => (m.parent_id ?? m.parentId) === parentId);
	};

	const getAllDescendantIds = (parentId: number): number[] => {
		const children = getDirectChildren(parentId);
		let ids = children.map((c) => c.id);
		children.forEach((c) => {
			ids = ids.concat(getAllDescendantIds(c.id));
		});
		return ids;
	};

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
		modules.forEach((m) => {
			const pid = m.parent_id ?? m.parentId;
			if (pid) parentIds.add(pid);
		});

		if (expandedModuleIds.size >= parentIds.size && parentIds.size > 0) {
			setExpandedModuleIds(new Set());
		} else {
			setExpandedModuleIds(parentIds);
		}
	};

	const handleSelectModule = (id: number, checked: boolean) => {
		setSelectedModuleIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	const handleBulkSelectParent = (parentId: number, checked: boolean) => {
		const descendants = getAllDescendantIds(parentId);
		setSelectedModuleIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(parentId);
				descendants.forEach((d) => next.add(d));
			} else {
				next.delete(parentId);
				descendants.forEach((d) => next.delete(d));
			}
			return next;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedModuleIds(new Set(modules.map((m) => m.id)));
		} else {
			setSelectedModuleIds(new Set());
		}
	};

	const allSelected = modules.length > 0 && selectedModuleIds.size === modules.length;

	const handleOpenCreateModule = () => {
		setEditingModule(null);
		setParentForNewSubmodule(null);
		setIsModuleModalOpen(true);
	};

	const handleOpenCreateSubmodule = (parentId: number) => {
		setEditingModule(null);
		setParentForNewSubmodule(parentId);
		setIsModuleModalOpen(true);
	};

	const handleOpenEditModule = (mod: IModule & { parent_name?: string | null }) => {
		setEditingModule(mod);
		setParentForNewSubmodule(null);
		setIsModuleModalOpen(true);
	};

	const handleOpenCreateType = () => {
		setEditingType(null);
		setIsTypeModalOpen(true);
	};

	const handleOpenEditType = (type: IModuleType) => {
		setEditingType(type);
		setIsTypeModalOpen(true);
	};

	const handleConfirmDeleteModule = async () => {
		if (!deleteModuleDialog.module?.id) return;
		try {
			await deleteModuleMutation.mutateAsync(deleteModuleDialog.module.id);
			toast.success(`Module '${deleteModuleDialog.module.name}' has been deleted`);
			setDeleteModuleDialog({ isOpen: false, module: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete module');
		}
	};

	const handleConfirmBulkDelete = async () => {
		if (selectedModuleIds.size === 0) return;
		try {
			for (const id of Array.from(selectedModuleIds)) {
				await deleteModuleMutation.mutateAsync(id);
			}
			toast.success(`${selectedModuleIds.size} modules deleted successfully`);
			setSelectedModuleIds(new Set());
			setBulkDeleteDialog(false);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete selected modules');
		}
	};

	const handleConfirmDeleteType = async () => {
		if (!deleteTypeDialog.type?.id) return;
		try {
			await deleteTypeMutation.mutateAsync(deleteTypeDialog.type.id);
			toast.success(`Module type '${deleteTypeDialog.type.name}' has been deleted`);
			setDeleteTypeDialog({ isOpen: false, type: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete module type');
		}
	};

	const resolveModuleIcon = (name?: string | null, iconName?: string | null, typeName?: string | null) => {
		const n = (name || '').toLowerCase();
		const i = (iconName || '').toLowerCase();
		const t = (typeName || '').toLowerCase();

		if (i.includes('dashboard') || n.includes('overview')) return LayoutDashboard;
		if (i.includes('cpu') || n.includes('health') || i.includes('activity')) return Cpu;
		if (i.includes('radio') || n.includes('cellular')) return Radio;
		if (i.includes('video') || n.includes('dvr')) return Video;
		if (i.includes('file') || n.includes('report')) return FileText;
		if (i.includes('user') || n.includes('user')) return Users;
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

	// Recursive row renderer matching reference screenshot
	const renderTreeRowsRecursive = (parentId: number | null, level: number = 0): React.JSX.Element[] => {
		const currentList = parentId === null ? rootModules : getDirectChildren(parentId);

		return currentList.flatMap((mod) => {
			const children = getDirectChildren(mod.id);
			const hasChildren = children.length > 0;
			const isExpanded = expandedModuleIds.has(mod.id);
			const isSelected = selectedModuleIds.has(mod.id);
			const typeName = mod.module_type?.name || 'route menu';
			const isServiceApi = typeName.toLowerCase().includes('service');
			const IconComponent = resolveModuleIcon(mod.name, mod.icon, typeName);

			const rowElement = (
				<tr
					key={mod.id}
					className={`group transition-colors border-b border-slate-100 dark:border-slate-800/80 ${
						isSelected
							? 'bg-blue-50/50 dark:bg-blue-950/20'
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
									onClick={() => toggleExpand(mod.id)}
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

							<input
								type='checkbox'
								checked={isSelected}
								onChange={(e) => handleSelectModule(mod.id, e.target.checked)}
								className='w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#0073ea] focus:ring-blue-500/20 cursor-pointer accent-[#0073ea]'
							/>
						</div>
					</td>

					{/* Column 2: Module Name & Description + Icon */}
					<td className='py-3.5 px-4 align-middle'>
						<div className='flex items-center gap-3.5'>
							{!isServiceApi && (
								<div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#0073ea] to-[#005bb5] flex items-center justify-center text-white shadow-xs shrink-0'>
									<IconComponent className='w-5 h-5' />
								</div>
							)}
							<div className='min-w-0'>
								<div className='flex items-center gap-2'>
									<span className='font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm'>
										{mod.name}
									</span>
									{hasChildren && (
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0073ea] dark:text-[#3894ff] border border-blue-200/60 dark:border-blue-800/60'>
											{children.length} {children.length === 1 ? 'submodule' : 'submodules'}
										</span>
									)}
								</div>
								{mod.description && (
									<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md'>
										{mod.description}
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
						{mod.route ? (
							<code className='inline-flex items-center px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'>
								{mod.route}
							</code>
						) : null}
					</td>

					{/* Column 5: Action Menu */}
					<td className='py-3.5 px-4 align-middle text-right whitespace-nowrap relative'>
						<div className='inline-block text-left'>
							<button
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									setActiveMenuId(activeMenuId === mod.id ? null : mod.id);
								}}
								className='p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer'
								title='Actions'
							>
								<MoreVertical className='w-4 h-4' />
							</button>

							{activeMenuId === mod.id && (
								<>
									<div
										className='fixed inset-0 z-20'
										onClick={() => setActiveMenuId(null)}
									/>
									<div className='absolute right-4 mt-1 w-44 rounded-xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100'>
										<button
											type='button'
											onClick={() => {
												setActiveMenuId(null);
												handleOpenCreateSubmodule(mod.id);
											}}
											className='w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors'
										>
											<FolderPlus className='w-3.5 h-3.5 text-[#0073ea]' />
											<span>Add Submodule</span>
										</button>
										<button
											type='button'
											onClick={() => {
												setActiveMenuId(null);
												handleOpenEditModule(mod);
											}}
											className='w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors'
										>
											<Pencil className='w-3.5 h-3.5 text-slate-400' />
											<span>Edit</span>
										</button>
										<div className='my-1 border-t border-slate-100 dark:border-slate-800' />
										<button
											type='button'
											onClick={() => {
												setActiveMenuId(null);
												setDeleteModuleDialog({ isOpen: true, module: mod });
											}}
											className='w-full px-3.5 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium cursor-pointer transition-colors'
										>
											<Trash2 className='w-3.5 h-3.5' />
											<span>Delete</span>
										</button>
									</div>
								</>
							)}
						</div>
					</td>
				</tr>
			);

			const elements: React.JSX.Element[] = [rowElement];

			if (hasChildren && isExpanded) {
				elements.push(...renderTreeRowsRecursive(mod.id, level + 1));
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
						Modules & Navigation
					</h2>
					<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
						Manage system capabilities, routes, tree permissions, and module types
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{activeSubTab === 'module' ? (
						<button
							onClick={handleOpenCreateModule}
							className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
						>
							<Plus className='w-4 h-4' />
							<span>New Root Module</span>
						</button>
					) : (
						<button
							onClick={handleOpenCreateType}
							className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
						>
							<Plus className='w-4 h-4' />
							<span>New Module Type</span>
						</button>
					)}
				</div>
			</div>

			{/* Sub Tabs */}
			<div className='flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800'>
				<div className='flex items-center gap-6'>
					<button
						onClick={() => setActiveSubTab('module')}
						className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all relative cursor-pointer ${
							activeSubTab === 'module'
								? 'text-[#0073ea] dark:text-[#3894ff]'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
						}`}
					>
						<Layers className='w-4 h-4' />
						<span>Modules Tree ({modules.length})</span>
						{activeSubTab === 'module' && (
							<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#0073ea] rounded-full' />
						)}
					</button>

					<button
						onClick={() => setActiveSubTab('type')}
						className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all relative cursor-pointer ${
							activeSubTab === 'type'
								? 'text-[#0073ea] dark:text-[#3894ff]'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
						}`}
					>
						<Grid className='w-4 h-4' />
						<span>Module Types ({moduleTypes.length})</span>
						{activeSubTab === 'type' && (
							<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#0073ea] rounded-full' />
						)}
					</button>
				</div>
			</div>

			{/* ==================================================================== */}
			{/* MODULES TREE VIEW */}
			{/* ==================================================================== */}
			{activeSubTab === 'module' && (
				<div className='space-y-4'>
					{/* Search & Bulk Bar */}
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121c2f] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs'>
						<div className='relative flex-1 max-w-md'>
							<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
							<input
								type='text'
								value={searchModule}
								onChange={(e) => setSearchModule(e.target.value)}
								placeholder='Search modules by name, route, description...'
								className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>

						<div className='flex items-center gap-2'>
							{selectedModuleIds.size > 0 && (
								<button
									onClick={() => setBulkDeleteDialog(true)}
									className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer'
								>
									<Trash2 className='w-3.5 h-3.5' />
									<span>Delete Selected ({selectedModuleIds.size})</span>
								</button>
							)}

							<button
								onClick={toggleExpandAll}
								className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer'
							>
								<ChevronsUpDown className='w-3.5 h-3.5' />
								<span>
									{expandedModuleIds.size > 0 ? 'Collapse All' : 'Expand All'}
								</span>
							</button>
						</div>
					</div>

					{/* Unified Hierarchical Tree Table */}
					<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
						{isLoadingModules ? (
							<div className='p-6 space-y-3'>
								{Array.from({ length: 5 }).map((_, i) => (
									<div
										key={i}
										className='h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse'
									/>
								))}
							</div>
						) : rootModules.length === 0 ? (
							<div className='p-12 text-center text-slate-400'>
								<FolderTree className='w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600' />
								<p className='text-sm font-medium text-slate-600 dark:text-slate-400'>No modules found</p>
								<p className='text-xs text-slate-400 mt-1'>Try adjusting your search or create a new module</p>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full text-left border-collapse'>
									<thead>
										<tr className='border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wider uppercase bg-slate-50/60 dark:bg-slate-800/40'>
											<th className='py-3.5 pl-4 pr-2 w-16 text-right'>
												<input
													type='checkbox'
													checked={allSelected}
													onChange={(e) => handleSelectAll(e.target.checked)}
													className='w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#0073ea] focus:ring-blue-500/20 cursor-pointer accent-[#0073ea]'
													title='Select All'
												/>
											</th>
											<th className='py-3.5 px-4'>Module Name</th>
											<th className='py-3.5 px-4'>Type</th>
											<th className='py-3.5 px-4'>Route</th>
											<th className='py-3.5 px-4 text-right'>Action</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80 text-xs'>
										{renderTreeRowsRecursive(null, 0)}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ==================================================================== */}
			{/* MODULE TYPES TAB */}
			{/* ==================================================================== */}
			{activeSubTab === 'type' && (
				<div className='space-y-4'>
					<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-xs'>
								<thead className='bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
									<tr>
										<th className='px-5 py-3.5'>Type Name</th>
										<th className='px-5 py-3.5'>Icon</th>
										<th className='px-5 py-3.5'>Description</th>
										<th className='px-5 py-3.5 text-right'>Actions</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
									{isLoadingTypes ? (
										Array.from({ length: 3 }).map((_, i) => (
											<tr key={i} className='animate-pulse'>
												<td className='px-5 py-4'>
													<div className='w-28 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
												</td>
												<td className='px-5 py-4'>
													<div className='w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded' />
												</td>
												<td className='px-5 py-4'>
													<div className='w-48 h-3 bg-slate-200 dark:bg-slate-800 rounded' />
												</td>
												<td className='px-5 py-4 text-right'>
													<div className='w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto' />
												</td>
											</tr>
										))
									) : moduleTypes.length === 0 ? (
										<tr>
											<td colSpan={4} className='p-8 text-center text-slate-400'>
												No module types configured.
											</td>
										</tr>
									) : (
										moduleTypes.map((type) => (
											<tr
												key={type.id}
												className='hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors'
											>
												<td className='px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100'>
													<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60'>
														{type.name.toUpperCase()}
													</span>
												</td>
												<td className='px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]'>
													{type.icon || '—'}
												</td>
												<td className='px-5 py-3.5 text-slate-500 dark:text-slate-400'>
													{type.description || '—'}
												</td>
												<td className='px-5 py-3.5 text-right'>
													<div className='flex items-center justify-end gap-1'>
														<button
															onClick={() => handleOpenEditType(type)}
															className='p-1.5 rounded-lg text-slate-500 hover:text-[#0073ea] dark:hover:text-[#3894ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
															title='Edit Type'
														>
															<Pencil className='w-3.5 h-3.5' />
														</button>
														<button
															onClick={() => setDeleteTypeDialog({ isOpen: true, type })}
															className='p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
															title='Delete Type'
														>
															<Trash2 className='w-3.5 h-3.5' />
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* Modals */}
			<ModuleFormModal
				isOpen={isModuleModalOpen}
				onClose={() => setIsModuleModalOpen(false)}
				module={editingModule}
				defaultParentId={parentForNewSubmodule}
			/>

			<ModuleTypeFormModal
				isOpen={isTypeModalOpen}
				onClose={() => setIsTypeModalOpen(false)}
				moduleType={editingType}
			/>

			<ConfirmDialog
				isOpen={deleteModuleDialog.isOpen}
				title='Delete Module'
				description={`Are you sure you want to delete module "${deleteModuleDialog.module?.name}"? Any submodules attached to it will become root items.`}
				confirmLabel='Delete Module'
				variant='danger'
				isLoading={deleteModuleMutation.isPending}
				onConfirm={handleConfirmDeleteModule}
				onClose={() => setDeleteModuleDialog({ isOpen: false, module: null })}
			/>

			<ConfirmDialog
				isOpen={bulkDeleteDialog}
				title='Delete Selected Modules'
				description={`Are you sure you want to delete ${selectedModuleIds.size} selected modules? This action cannot be undone.`}
				confirmLabel='Delete All'
				variant='danger'
				isLoading={deleteModuleMutation.isPending}
				onConfirm={handleConfirmBulkDelete}
				onClose={() => setBulkDeleteDialog(false)}
			/>

			<ConfirmDialog
				isOpen={deleteTypeDialog.isOpen}
				title='Delete Module Type'
				description={`Are you sure you want to delete module type "${deleteTypeDialog.type?.name}"?`}
				confirmLabel='Delete Type'
				variant='danger'
				isLoading={deleteTypeMutation.isPending}
				onConfirm={handleConfirmDeleteType}
				onClose={() => setDeleteTypeDialog({ isOpen: false, type: null })}
			/>
		</div>
	);
};
