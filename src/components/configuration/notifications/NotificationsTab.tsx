'use client';

import React, { useState } from 'react';
import {
	useNotificationEvents,
	useUpdateNotificationEvent,
	useDeleteNotificationEvent,
} from '@/store/api/notifications';
import { useDebounce } from '@/hooks/useDebounce';
import { NotificationRuleModal } from '@/components/notifications/NotificationRuleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { INotificationEvent } from '@/types/notifications';
import {
	Bell,
	Plus,
	Search,
	Pencil,
	Trash2,
	Send,
	Mail,
	Slack,
} from 'lucide-react';
import { toast } from 'sonner';

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
	</svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.76.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm5.43 14.38c-.22.62-1.12 1.15-1.82 1.3-.47.1-1.08.18-3.15-.67-2.64-1.09-4.34-3.78-4.47-3.96-.13-.17-1.06-1.42-1.06-2.7 0-1.28.67-1.92.91-2.18.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.81.81 1.94.07.13.11.28.02.46-.09.17-.13.28-.26.43-.13.15-.27.34-.39.46-.13.13-.27.27-.12.53.15.26.68 1.12 1.45 1.81.99.89 1.83 1.16 2.09 1.29.26.13.41.11.56-.06.15-.17.65-.76.83-1.02.17-.26.35-.22.59-.13.24.09 1.52.72 1.78.85.26.13.43.2.5.3.07.11.07.63-.15 1.25Z'
		/>
	</svg>
);

const CHANNEL_ICONS: Record<string, React.ElementType> = {
	in_app: Bell,
	whatsapp: WhatsAppIcon,
	telegram: Send,
	email: Mail,
	slack: Slack,
	discord: DiscordIcon,
};

export const NotificationsTab: React.FC = () => {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 400);
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [selectedRule, setSelectedRule] = useState<INotificationEvent | null>(null);
	const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; rule: INotificationEvent | null }>({
		isOpen: false,
		rule: null,
	});

	const { data: eventsData, isLoading } = useNotificationEvents(1, 100, {
		search: debouncedSearch.trim() || undefined,
	});
	const { data: allEventsData } = useNotificationEvents(1, 100);

	const updateMutation = useUpdateNotificationEvent();
	const deleteMutation = useDeleteNotificationEvent();

	const handleToggleRule = async (rule: INotificationEvent) => {
		const currentChannels = rule.channels || [];
		const currentlyActive = currentChannels.some((c) => c.is_enabled !== false);
		const nextChannels = currentlyActive
			? currentChannels.map((c) => ({ ...c, is_enabled: false }))
			: currentChannels.length > 0
				? currentChannels.map((c) => ({ ...c, is_enabled: true }))
				: [{ channel_type: 'in_app', name: 'In-App Notification', is_enabled: true }];

		setTogglingId(rule.id);
		try {
			await updateMutation.mutateAsync({
				id: rule.id,
				channels: nextChannels,
			});
			toast.success(
				currentlyActive
					? `Rule "${rule.name}" dinonaktifkan`
					: `Rule "${rule.name}" diaktifkan`
			);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Gagal mengubah status rule');
		} finally {
			setTogglingId(null);
		}
	};

	const handleOpenCreate = () => {
		setSelectedRule(null);
		setIsRuleModalOpen(true);
	};

	const handleOpenEdit = (rule: INotificationEvent) => {
		setSelectedRule(rule);
		setIsRuleModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteDialog.rule?.id) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.rule.id);
			toast.success('Notification rule removed');
			setDeleteDialog({ isOpen: false, rule: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete rule');
		}
	};

	const searchedEvents = eventsData?.data || [];
	const allEvents = allEventsData?.data || searchedEvents;
	const activeCount = searchedEvents.filter((e) => (e.channels || []).some((c) => c.is_enabled !== false)).length;
	const inactiveCount = searchedEvents.length - activeCount;
	const events = searchedEvents.filter((e) => {
		const isAct = (e.channels || []).some((c) => c.is_enabled !== false);
		if (statusFilter === 'active') return isAct;
		if (statusFilter === 'inactive') return !isAct;
		return true;
	});

	return (
		<div className='space-y-6'>
			{/* Top Bar */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h2 className='text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
						Notification Rules
					</h2>
					<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
						Configure incident alerts, gateway event codes, and multi-channel routing
					</p>
				</div>

				<button
					onClick={handleOpenCreate}
					className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
				>
					<Plus className='w-4 h-4' />
					<span>New Rule</span>
				</button>
			</div>

			{/* Filter */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
				<div className='relative max-w-md w-full'>
					<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
					<input
						type='text'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='Search notification rules...'
						className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea] transition-all'
					/>
				</div>

				<div className='inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 self-start sm:self-auto'>
					<button
						type='button'
						onClick={() => setStatusFilter('all')}
						className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
							statusFilter === 'all'
								? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
						}`}
					>
						All ({searchedEvents.length})
					</button>
					<button
						type='button'
						onClick={() => setStatusFilter('active')}
						className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
							statusFilter === 'active'
								? 'bg-emerald-500/15 text-[#00a862] dark:text-[#00c875]'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
						}`}
					>
						Active ({activeCount})
					</button>
					<button
						type='button'
						onClick={() => setStatusFilter('inactive')}
						className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
							statusFilter === 'inactive'
								? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
						}`}
					>
						Inactive ({inactiveCount})
					</button>
				</div>
			</div>

			{/* Table */}
			<div className='bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full text-left text-xs'>
						<thead className='bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
							<tr>
								<th className='px-5 py-3.5'>Event Rule</th>
								<th className='px-5 py-3.5'>Category</th>
								<th className='px-5 py-3.5'>Status</th>
								<th className='px-5 py-3.5'>Active Channels</th>
								<th className='px-5 py-3.5'>Description</th>
								<th className='px-5 py-3.5 text-right'>Actions</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-slate-100 dark:divide-slate-800/80'>
							{isLoading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={i} className='animate-pulse'>
										<td className='px-5 py-4'>
											<div className='w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded' />
										</td>
										<td className='px-5 py-4'>
											<div className='w-40 h-3.5 bg-slate-200 dark:bg-slate-800 rounded' />
										</td>
										<td className='px-5 py-4 text-right'>
											<div className='w-14 h-6 bg-slate-200 dark:bg-slate-800 rounded ml-auto' />
										</td>
									</tr>
								))
							) : events.length === 0 ? (
								<tr>
									<td colSpan={6} className='px-5 py-12 text-center text-slate-400'>
										No notification rules found.
									</td>
								</tr>
							) : (
								events.map((e) => {
									const channels = e.channels || [];
									const isRuleActive = channels.some((c) => c.is_enabled !== false);
									const isToggling = togglingId === e.id;

									return (
										<tr
											key={e.id}
											className='hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors'
										>
											<td className='px-5 py-4'>
												<div className='space-y-0.5'>
													<div className='font-bold text-slate-900 dark:text-slate-100'>
														{e.name}
													</div>
													<code className='text-[10px] text-slate-400 font-mono'>
														{e.event_code}
													</code>
												</div>
											</td>

											<td className='px-5 py-4'>
												<span className='inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase'>
													{e.category}
												</span>
											</td>

											<td className='px-5 py-4'>
												<button
													type='button'
													disabled={isToggling}
													onClick={() => handleToggleRule(e)}
													className='inline-flex items-center gap-2 cursor-pointer disabled:opacity-50'
													title={isRuleActive ? 'Klik untuk nonaktifkan rule' : 'Klik untuk aktifkan rule'}
												>
													<span
														className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
															isRuleActive
																? 'bg-[#00c875]'
																: 'bg-slate-300 dark:bg-slate-700'
														}`}
													>
														<span
															className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
																isRuleActive ? 'translate-x-4' : 'translate-x-0'
															}`}
														/>
													</span>
													<span
														className={`text-[11px] font-semibold ${
															isRuleActive
																? 'text-[#00a862] dark:text-[#00c875]'
																: 'text-slate-400'
														}`}
													>
														{isRuleActive ? 'Active' : 'Inactive'}
													</span>
												</button>
											</td>

											<td className='px-5 py-4'>
												{channels.length === 0 ? (
													<span className='text-[11px] text-slate-400 italic'>None</span>
												) : (
													<div className='flex items-center gap-1.5'>
														{channels.map((c, idx) => {
															const Icon = CHANNEL_ICONS[c.channel_type] || Bell;
															const chEnabled = c.is_enabled !== false;
															return (
																<div
																	key={idx}
																	className={`p-1 rounded-md border ${
																		chEnabled
																			? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-[#0073ea] dark:text-[#3894ff]'
																			: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'
																	}`}
																	title={`${c.channel_type}${chEnabled ? '' : ' (Disabled)'}`}
																>
																	<Icon className='w-3.5 h-3.5' />
																</div>
															);
														})}
													</div>
												)}
											</td>

											<td className='px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate'>
												{e.description || '-'}
											</td>

											<td className='px-5 py-4 text-right'>
												<div className='flex items-center justify-end gap-1.5'>
													<button
														onClick={() => handleOpenEdit(e)}
														className='p-1.5 rounded-lg text-slate-500 hover:text-[#0073ea] dark:hover:text-[#3894ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
														title='Edit Rule'
													>
														<Pencil className='w-3.5 h-3.5' />
													</button>
													<button
														onClick={() => setDeleteDialog({ isOpen: true, rule: e })}
														className='p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
														title='Delete Rule'
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

			<NotificationRuleModal
				isOpen={isRuleModalOpen}
				onClose={() => setIsRuleModalOpen(false)}
				rule={selectedRule}
				availableEvents={allEvents}
			/>

			<ConfirmDialog
				isOpen={deleteDialog.isOpen}
				title='Delete Notification Rule'
				description={`Are you sure you want to remove notification event "${deleteDialog.rule?.name}"?`}
				confirmLabel='Delete Rule'
				variant='danger'
				isLoading={deleteMutation.isPending}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteDialog({ isOpen: false, rule: null })}
			/>
		</div>
	);
};

