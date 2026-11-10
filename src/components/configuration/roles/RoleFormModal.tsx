'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldPlus, Save, Loader2 } from 'lucide-react';
import { IRole } from '@/types/model';
import { useCreateRole, useUpdateRole } from '@/store/api/system';
import { toast } from 'sonner';

interface RoleFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	role?: IRole | null;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, role }) => {
	const isEdit = Boolean(role?.id);
	const createRoleMutation = useCreateRole();
	const updateRoleMutation = useUpdateRole();

	const [formData, setFormData] = useState({
		name: '',
		alias: '',
		color: '#3b82f6',
		description: '',
	});

	useEffect(() => {
		if (isOpen) {
			if (role) {
				setFormData({
					name: role.name || '',
					alias: role.alias || '',
					color: role.color || '#3b82f6',
					description: role.description || '',
				});
			} else {
				setFormData({
					name: '',
					alias: '',
					color: '#3b82f6',
					description: '',
				});
			}
		}
	}, [isOpen, role]);

	if (!isOpen) return null;

	const isPending = createRoleMutation.isPending || updateRoleMutation.isPending;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error('Role name is required');
			return;
		}
		if (!formData.alias.trim()) {
			toast.error('Role alias is required');
			return;
		}

		try {
			if (isEdit && role?.id) {
				await updateRoleMutation.mutateAsync({
					id: role.id,
					name: formData.name.trim(),
					alias: formData.alias.trim(),
					color: formData.color,
					description: formData.description.trim() || undefined,
				});
				toast.success('Role updated successfully');
			} else {
				await createRoleMutation.mutateAsync({
					name: formData.name.trim(),
					alias: formData.alias.trim(),
					color: formData.color,
					description: formData.description.trim() || undefined,
				});
				toast.success('Role created successfully');
			}
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to save role');
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'>
			<div className='bg-white dark:bg-[#121c2f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'>
				<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0073ea] dark:text-[#3894ff] shrink-0'>
							<ShieldPlus className='w-5 h-5' />
						</div>
						<div>
							<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
								{isEdit ? 'Edit Role' : 'Create New Role'}
							</h3>
							<p className='text-xs text-slate-500 dark:text-slate-400'>
								{isEdit ? 'Modify role identity and color branding' : 'Define a new RBAC role definition'}
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
								Role Name <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder='e.g. Field Engineer'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Alias Code <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								required
								value={formData.alias}
								onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
								placeholder='e.g. engineer'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>
					</div>

					<div>
						<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
							Badge Color
						</label>
						<div className='flex items-center gap-3'>
							<input
								type='color'
								value={formData.color}
								onChange={(e) => setFormData({ ...formData, color: e.target.value })}
								className='w-10 h-10 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent'
							/>
							<input
								type='text'
								value={formData.color}
								onChange={(e) => setFormData({ ...formData, color: e.target.value })}
								placeholder='#3B82F6'
								className='w-32 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea]'
							/>
							<div
								className='px-3 py-1.5 rounded-full text-xs font-bold border'
								style={{
									backgroundColor: `${formData.color}15`,
									borderColor: `${formData.color}30`,
									color: formData.color,
								}}
							>
								Preview Badge
							</div>
						</div>
					</div>

					<div>
						<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
							Description
						</label>
						<textarea
							rows={3}
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder='Describe responsibilities and privileges...'
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
									<span>{isEdit ? 'Update Role' : 'Create Role'}</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

