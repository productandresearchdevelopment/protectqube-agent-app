'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Loader2 } from 'lucide-react';
import { IModule } from '@/types/model';
import { useCreateModule, useUpdateModule, useModuleTypes, useModules } from '@/store/api/system';
import { toast } from 'sonner';

interface ModuleFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	module?: (IModule & { parent_name?: string | null }) | null;
	defaultParentId?: number | null;
}

export const ModuleFormModal: React.FC<ModuleFormModalProps> = ({ isOpen, onClose, module, defaultParentId }) => {
	const isEdit = Boolean(module?.id);
	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();

	const { data: moduleTypes = [] } = useModuleTypes();
	const { data: allModules = [] } = useModules();

	const [formData, setFormData] = useState({
		name: '',
		module_type_id: '',
		parent_id: '',
		route: '',
		icon: '',
		description: '',
	});

	useEffect(() => {
		if (isOpen) {
			if (module) {
				setFormData({
					name: module.name || '',
					module_type_id: module.module_type_id || module.moduleTypeId || '',
					parent_id: module.parent_id ? String(module.parent_id) : (module.parentId ? String(module.parentId) : ''),
					route: module.route || '',
					icon: module.icon || '',
					description: module.description || '',
				});
			} else {
				setFormData({
					name: '',
					module_type_id: moduleTypes[0]?.id || '',
					parent_id: defaultParentId ? String(defaultParentId) : '',
					route: '',
					icon: '',
					description: '',
				});
			}
		}
	}, [isOpen, module, moduleTypes, defaultParentId]);

	if (!isOpen) return null;

	const isPending = createModuleMutation.isPending || updateModuleMutation.isPending;

	// Candidate parent modules (exclude self if editing)
	const parentOptions = allModules.filter((m) => !module || m.id !== module.id);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error('Module name is required');
			return;
		}
		if (!formData.module_type_id) {
			toast.error('Please select a module type');
			return;
		}

		try {
			if (isEdit && module?.id) {
				await updateModuleMutation.mutateAsync({
					id: module.id,
					name: formData.name.trim(),
					module_type_id: formData.module_type_id,
					parent_id: formData.parent_id ? Number(formData.parent_id) : null,
					route: formData.route.trim() || undefined,
					icon: formData.icon.trim() || undefined,
					description: formData.description.trim() || undefined,
				});
				toast.success('Module updated successfully');
			} else {
				await createModuleMutation.mutateAsync({
					name: formData.name.trim(),
					module_type_id: formData.module_type_id,
					parent_id: formData.parent_id ? Number(formData.parent_id) : null,
					route: formData.route.trim() || undefined,
					icon: formData.icon.trim() || undefined,
					description: formData.description.trim() || undefined,
				});
				toast.success('Module created successfully');
			}
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to save module');
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'>
			<div className='bg-white dark:bg-[#121c2f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'>
				<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0073ea] dark:text-[#3894ff] shrink-0'>
							<Layers className='w-5 h-5' />
						</div>
						<div>
							<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
								{isEdit ? 'Edit Module' : 'Create New Module'}
							</h3>
							<p className='text-xs text-slate-500 dark:text-slate-400'>
								Configure system features, routes, and categorization
							</p>
						</div>
					</div>

					<button
						type='button'
						onClick={onClose}
						disabled={isPending}
						className='p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='p-6 space-y-4 overflow-y-auto flex-1'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Module Name <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder='e.g. System Health'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Module Type <span className='text-rose-500'>*</span>
							</label>
							<select
								required
								value={formData.module_type_id}
								onChange={(e) => setFormData({ ...formData, module_type_id: e.target.value })}
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all cursor-pointer'
							>
								<option value=''>-- Select Type --</option>
								{moduleTypes.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name} {t.description ? `(${t.description})` : ''}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Route Path
							</label>
							<input
								type='text'
								value={formData.route}
								onChange={(e) => setFormData({ ...formData, route: e.target.value })}
								placeholder='e.g. /system-health'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all font-mono'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Parent Module (Optional)
							</label>
							<select
								value={formData.parent_id}
								onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all cursor-pointer'
							>
								<option value=''>None (Root Module)</option>
								{parentOptions.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
							Icon Identifier
						</label>
						<input
							type='text'
							value={formData.icon}
							onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
							placeholder='e.g. Cpu, Radio, Video, Bell, Boxes'
							className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
						/>
					</div>

					<div>
						<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
							Description
						</label>
						<textarea
							rows={2}
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder='Module description...'
							className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all resize-none'
						/>
					</div>

					<div className='pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3'>
						<button
							type='button'
							onClick={onClose}
							disabled={isPending}
							className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending}
							className='flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50'
						>
							{isPending ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Save className='w-4 h-4' />
									<span>{isEdit ? 'Update Module' : 'Create Module'}</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

