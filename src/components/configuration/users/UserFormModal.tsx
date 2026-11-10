'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Loader2, Shield } from 'lucide-react';
import { IUser } from '@/types/model';
import { useCreateUser, useUpdateUser, useRoles } from '@/store/api/system';
import { toast } from 'sonner';

interface UserFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	user?: IUser | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user }) => {
	const isEdit = Boolean(user?.id);
	const { data: roles = [] } = useRoles();
	const createUserMutation = useCreateUser();
	const updateUserMutation = useUpdateUser();

	const [formData, setFormData] = useState({
		name: '',
		username: '',
		email: '',
		password: '',
		phone: '',
		address: '',
		role_id: '',
	});

	useEffect(() => {
		if (isOpen) {
			if (user) {
				setFormData({
					name: user.name || '',
					username: user.username || '',
					email: user.email || '',
					password: '',
					phone: user.phone || '',
					address: user.address || '',
					role_id: user.role_id || user.roleId || (roles[0]?.id || ''),
				});
			} else {
				setFormData({
					name: '',
					username: '',
					email: '',
					password: '',
					phone: '',
					address: '',
					role_id: roles[0]?.id || '',
				});
			}
		}
	}, [isOpen, user, roles]);

	if (!isOpen) return null;

	const isPending = createUserMutation.isPending || updateUserMutation.isPending;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error('Name is required');
			return;
		}
		if (!formData.username.trim()) {
			toast.error('Username is required');
			return;
		}
		if (!formData.email.trim()) {
			toast.error('Email is required');
			return;
		}
		if (!formData.role_id) {
			toast.error('Please select a role');
			return;
		}
		if (!isEdit && !formData.password.trim()) {
			toast.error('Password is required for new users');
			return;
		}

		try {
			if (isEdit && user?.id) {
				await updateUserMutation.mutateAsync({
					id: user.id,
					name: formData.name,
					username: formData.username,
					email: formData.email,
					phone: formData.phone || undefined,
					address: formData.address || undefined,
					role_id: formData.role_id,
					password: formData.password ? formData.password : undefined,
				});
				toast.success('User updated successfully');
			} else {
				await createUserMutation.mutateAsync({
					name: formData.name,
					username: formData.username,
					email: formData.email,
					password: formData.password,
					phone: formData.phone || undefined,
					address: formData.address || undefined,
					role_id: formData.role_id,
				});
				toast.success('User created successfully');
			}
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to save user');
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'>
			<div className='bg-white dark:bg-[#121c2f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'>
				<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0073ea] dark:text-[#3894ff] shrink-0'>
							<UserPlus className='w-5 h-5' />
						</div>
						<div>
							<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
								{isEdit ? 'Edit User' : 'Create New User'}
							</h3>
							<p className='text-xs text-slate-500 dark:text-slate-400'>
								{isEdit ? 'Update user details and credentials' : 'Add a new member to the system'}
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
								Full Name <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder='e.g. John Doe'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Username <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								required
								value={formData.username}
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								placeholder='e.g. johndoe'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Email Address <span className='text-rose-500'>*</span>
							</label>
							<input
								type='email'
								required
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								placeholder='e.g. john@company.com'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Phone Number
							</label>
							<input
								type='text'
								value={formData.phone}
								onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
								placeholder='e.g. +62 812 3456 7890'
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								Role <span className='text-rose-500'>*</span>
							</label>
							<div className='relative'>
								<select
									required
									value={formData.role_id}
									onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
									className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all appearance-none cursor-pointer'
								>
									<option value=''>-- Select Role --</option>
									{roles.map((r) => (
										<option key={r.id} value={r.id}>
											{r.name} ({r.alias})
										</option>
									))}
								</select>
								<Shield className='w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none' />
							</div>
						</div>

						<div>
							<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
								{isEdit ? 'New Password (leave blank to keep current)' : 'Password'} {!isEdit && <span className='text-rose-500'>*</span>}
							</label>
							<input
								type='password'
								required={!isEdit}
								value={formData.password}
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								placeholder={isEdit ? '••••••••' : 'Min. 6 characters'}
								className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
							/>
						</div>
					</div>

					<div>
						<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
							Address
						</label>
						<textarea
							rows={2}
							value={formData.address}
							onChange={(e) => setFormData({ ...formData, address: e.target.value })}
							placeholder='Street address, city, notes'
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
									<span>{isEdit ? 'Update User' : 'Create User'}</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

