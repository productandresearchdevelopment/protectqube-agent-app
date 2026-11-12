'use client';

import React, { useState } from 'react';
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	Users as UsersIcon,
	Shield,
	Mail,
	Phone,
	Calendar,
	Filter,
} from 'lucide-react';
import { IUser } from '@/types/model';
import { useUsers, useRoles, useDeleteUser } from '@/store/api/system';
import { UserFormModal } from './UserFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { formatToWIB } from '@/utils/common';

export const UsersTab: React.FC = () => {
	const [search, setSearch] = useState('');
	const [selectedRole, setSelectedRole] = useState('all');
	const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; user: IUser | null }>({
		isOpen: false,
		user: null,
	});

	const { data: roles = [] } = useRoles();
	const { data: users = [], isLoading } = useUsers({
		search: search.trim() || undefined,
		role_id: selectedRole !== 'all' ? selectedRole : undefined,
	});

	const deleteMutation = useDeleteUser();

	const handleOpenCreate = () => {
		setSelectedUser(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (user: IUser) => {
		setSelectedUser(user);
		setIsModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteDialog.user?.id) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.user.id);
			toast.success(`User '${deleteDialog.user.name}' has been deleted`);
			setDeleteDialog({ isOpen: false, user: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete user');
		}
	};

	return (
		<div className='space-y-6'>
			{/* Top Bar */}
			<div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
				<div>
					<h2 className='text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
						Users Management
					</h2>
					<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
						Manage system operator accounts, engineers, and roles
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-2.5'>
					{/* Search */}
					<div className='relative w-full sm:w-64'>
						<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
						<input
							type='text'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder='Search users...'
							className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121c2f] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
						/>
					</div>

					{/* Role Filter */}
					<div className='relative'>
						<select
							value={selectedRole}
							onChange={(e) => setSelectedRole(e.target.value)}
							className='pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121c2f] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all appearance-none cursor-pointer'
						>
							<option value='all'>All Roles ({roles.length})</option>
							{roles.map((r) => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</select>
						<Filter className='w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
					</div>

					{/* Create Button */}
					<button
						onClick={handleOpenCreate}
						className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer shrink-0'
					>
						<Plus className='w-4 h-4' />
						<span>New User</span>
					</button>
				</div>
			</div>

			{/* Users Table */}
			<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full text-left text-xs'>
						<thead className='bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider'>
							<tr>
								<th className='px-5 py-3.5'>User</th>
								<th className='px-5 py-3.5'>Role</th>
								<th className='px-5 py-3.5'>Contact</th>
								<th className='px-5 py-3.5'>Last Login</th>
								<th className='px-5 py-3.5 text-right'>Actions</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
							{isLoading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={i} className='animate-pulse'>
										<td className='px-5 py-4'>
											<div className='flex items-center gap-3'>
												<div className='w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800' />
												<div className='space-y-1.5'>
													<div className='w-28 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
													<div className='w-16 h-2.5 bg-slate-200 dark:bg-slate-800 rounded' />
												</div>
											</div>
										</td>
										<td className='px-5 py-4'>
											<div className='w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
										</td>
										<td className='px-5 py-4 text-right'>
											<div className='w-14 h-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto' />
										</td>
									</tr>
								))
							) : users.length === 0 ? (
								<tr>
									<td colSpan={5} className='px-5 py-12 text-center'>
										<div className='flex flex-col items-center justify-center text-slate-400 dark:text-slate-500'>
											<UsersIcon className='w-10 h-10 stroke-[1.5] mb-2 opacity-60' />
											<p className='text-xs font-semibold'>No users found</p>
											<p className='text-[11px] text-slate-400 mt-0.5'>
												{search ? 'Try modifying your search filter' : 'Create your first user account'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								users.map((u) => {
									const roleColor = u.role?.color || u.role_color || '#3b82f6';
									const roleName = u.role?.name || u.role_name || 'No Role';

									return (
										<tr
											key={u.id}
											className='hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors'
										>
											<td className='px-5 py-4'>
												<div className='flex items-center gap-3'>
													<div
														className='w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0'
														style={{ backgroundColor: roleColor }}
													>
														{(u.name || u.username || 'U').charAt(0).toUpperCase()}
													</div>
													<div className='min-w-0'>
														<div className='font-bold text-slate-900 dark:text-slate-100 truncate'>
															{u.name}
														</div>
														<div className='text-[11px] text-slate-400 truncate'>
															@{u.username}
														</div>
													</div>
												</div>
											</td>

											<td className='px-5 py-4'>
												<span
													className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border'
													style={{
														backgroundColor: `${roleColor}15`,
														borderColor: `${roleColor}30`,
														color: roleColor,
													}}
												>
													<Shield className='w-3 h-3' />
													{roleName}
												</span>
											</td>

											<td className='px-5 py-4'>
												<div className='space-y-0.5'>
													<div className='flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs'>
														<Mail className='w-3 h-3 text-slate-400 shrink-0' />
														<span className='truncate'>{u.email}</span>
													</div>
													{u.phone && (
														<div className='flex items-center gap-1.5 text-slate-400 text-[11px]'>
															<Phone className='w-3 h-3 shrink-0' />
															<span>{u.phone}</span>
														</div>
													)}
												</div>
											</td>

											<td className='px-5 py-4 text-slate-500 dark:text-slate-400 text-xs'>
												<div className='flex items-center gap-1.5'>
													<Calendar className='w-3 h-3 text-slate-400' />
													<span>{u.lastLogin ? formatToWIB(u.lastLogin) : 'Never'}</span>
												</div>
											</td>

											<td className='px-5 py-4 text-right'>
												<div className='flex items-center justify-end gap-1.5'>
													<button
														onClick={() => handleOpenEdit(u)}
														className='p-1.5 rounded-lg text-slate-500 hover:text-[#0073ea] dark:hover:text-[#3894ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
														title='Edit User'
													>
														<Pencil className='w-3.5 h-3.5' />
													</button>
													<button
														onClick={() => setDeleteDialog({ isOpen: true, user: u })}
														disabled={u.username === 'admin'}
														className='p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none'
														title='Delete User'
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

				{/* Footer Counter */}
				<div className='flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'>
					<div className='text-xs text-slate-500 dark:text-slate-400'>
						Total <span className='font-bold text-slate-900 dark:text-white'>{users.length}</span> users
					</div>
				</div>
			</div>

			{/* Modals */}
			<UserFormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				user={selectedUser}
			/>

			<ConfirmDialog
				isOpen={deleteDialog.isOpen}
				title='Delete User Account'
				description={`Are you sure you want to delete user "${deleteDialog.user?.name}" (@${deleteDialog.user?.username})? This action will deactivate access for this user.`}
				confirmLabel='Delete User'
				variant='danger'
				isLoading={deleteMutation.isPending}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteDialog({ isOpen: false, user: null })}
			/>
		</div>
	);
};
