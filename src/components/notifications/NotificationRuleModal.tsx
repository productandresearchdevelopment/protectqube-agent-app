'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
	Bell,
	Send,
	Mail,
	Slack,
	X,
	Search,
	Plus,
	Check,
	ChevronDown,
	Trash2,
	Users,
	User as UserIcon,
	RefreshCw,
	AlertCircle,
} from 'lucide-react';
import { INotificationEvent, INotificationChannelConfig, INotificationTarget } from '@/types/notifications';
import { useIntegrations } from '@/store/api/integrations';
import {
	useUpdateNotificationEvent,
	useRecipientsOptions,
	useDestinations,
	useCreateDestination,
	useDeleteDestination,
	useSyncDestinations,
} from '@/store/api/notifications';
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

const CHANNEL_ICON_MAP: Record<string, React.ElementType> = {
	in_app: Bell,
	whatsapp: WhatsAppIcon,
	telegram: Send,
	discord: DiscordIcon,
	slack: Slack,
	email: Mail,
};

const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
	in_app: 'In-App Notification',
	whatsapp: 'WhatsApp',
	telegram: 'Telegram',
	discord: 'Discord',
	slack: 'Slack',
	email: 'Email',
};

interface IntegrationTargetPickerProps {
	providerKey: string;
	selectedIds: string[];
	onChangeSelectedIds: (ids: string[], summary: string) => void;
}

const IntegrationTargetPicker: React.FC<IntegrationTargetPickerProps> = ({
	providerKey,
	selectedIds,
	onChangeSelectedIds,
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [typeFilter, setTypeFilter] = useState<'all' | 'chat' | 'group'>('all');
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [newEmail, setNewEmail] = useState('');
	const [newWebhookName, setNewWebhookName] = useState('');
	const [newWebhookUrl, setNewWebhookUrl] = useState('');

	const filterRef = useRef<HTMLDivElement>(null);

	const { data: destinations = [], isLoading } = useDestinations(providerKey);
	const { mutate: createDest, isPending: isCreating } = useCreateDestination();
	const { mutate: deleteDest } = useDeleteDestination();
	const { mutate: syncDest, isPending: isSyncing } = useSyncDestinations();

	const supportsSync = providerKey === 'whatsapp' || providerKey === 'telegram';

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
				setIsFilterOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const filterOptions: { key: 'all' | 'chat' | 'group'; label: string; count: number; badgeColor: string }[] =
		useMemo(
			() => [
				{
					key: 'all',
					label: 'All Targets',
					count: destinations.length,
					badgeColor: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
				},
				{
					key: 'chat',
					label: 'Personal',
					count: destinations.filter((d) => d.type === 'chat').length,
					badgeColor:
						'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
				},
				{
					key: 'group',
					label: 'Group',
					count: destinations.filter((d) => d.type === 'group' || d.type === 'channel').length,
					badgeColor:
						'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
				},
			],
			[destinations],
		);

	const activeOption = useMemo(
		() => filterOptions.find((opt) => opt.key === typeFilter) || filterOptions[0],
		[filterOptions, typeFilter],
	);

	const filteredDestinations = useMemo(() => {
		const q = searchTerm.toLowerCase().trim();
		return destinations.filter((d) => {
			if (typeFilter !== 'all') {
				if (typeFilter === 'chat' && d.type !== 'chat') return false;
				if (typeFilter === 'group' && d.type !== 'group' && d.type !== 'channel') return false;
			}
			if (!q) return true;
			const nameMatch = d.display_name.toLowerCase().includes(q);
			const idMatch = d.external_id.toLowerCase().includes(q);
			const typeMatch = (d.type || '').toLowerCase().includes(q);
			return nameMatch || idMatch || typeMatch;
		});
	}, [destinations, searchTerm, typeFilter]);

	const handleToggle = (destId: string) => {
		const next = selectedIds.includes(destId)
			? selectedIds.filter((id) => id !== destId)
			: [...selectedIds, destId];
		const summary = destinations
			.filter((d) => next.includes(d.id))
			.map((d) => d.display_name)
			.join(', ');
		onChangeSelectedIds(next, summary);
	};

	const handleSync = () => {
		syncDest(providerKey, {
			onSuccess: (res: any) => {
				toast.success(res?.message || 'Destinations synced successfully');
			},
			onError: (err: any) => {
				toast.error(err?.message || 'Failed to sync destinations');
			},
		});
	};

	const handleAddEmail = () => {
		const trimmed = newEmail.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmed)) {
			toast.error('Please enter a valid email address');
			return;
		}

		createDest(
			{
				provider_key: providerKey,
				external_id: trimmed,
				display_name: trimmed,
				type: 'email',
			},
			{
				onSuccess: (newDest) => {
					toast.success('Email target added successfully');
					setNewEmail('');
					const next = [...selectedIds, newDest.id];
					onChangeSelectedIds(
						next,
						[...destinations, newDest]
							.filter((d) => next.includes(d.id))
							.map((d) => d.display_name)
							.join(', '),
					);
				},
				onError: (err: any) => {
					toast.error(err?.message || 'Failed to add email target');
				},
			},
		);
	};

	const handleAddWebhook = () => {
		const nameTrimmed = newWebhookName.trim();
		const urlTrimmed = newWebhookUrl.trim();

		if (!nameTrimmed) {
			toast.error('Please enter a display name');
			return;
		}
		if (!urlTrimmed.startsWith('https://') && !urlTrimmed.startsWith('http://')) {
			toast.error('Webhook URL must start with https://');
			return;
		}

		createDest(
			{
				provider_key: providerKey,
				external_id: urlTrimmed,
				display_name: nameTrimmed,
				type: 'webhook',
			},
			{
				onSuccess: (newDest) => {
					toast.success('Webhook target added successfully');
					setNewWebhookName('');
					setNewWebhookUrl('');
					const next = [...selectedIds, newDest.id];
					onChangeSelectedIds(
						next,
						[...destinations, newDest]
							.filter((d) => next.includes(d.id))
							.map((d) => d.display_name)
							.join(', '),
					);
				},
				onError: (err: any) => {
					toast.error(err?.message || 'Failed to add webhook target');
				},
			},
		);
	};

	const handleDelete = (destId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!window.confirm('Are you sure you want to delete this target?')) return;

		deleteDest(
			{ id: destId, provider_key: providerKey },
			{
				onSuccess: () => {
					toast.success('Target deleted');
					const next = selectedIds.filter((id) => id !== destId);
					onChangeSelectedIds(
						next,
						destinations
							.filter((d) => next.includes(d.id))
							.map((d) => d.display_name)
							.join(', '),
					);
				},
				onError: (err: any) => {
					toast.error(err?.message || 'Failed to delete target');
				},
			},
		);
	};

	return (
		<div className='space-y-3.5 pt-1'>
			{supportsSync && (
				<div className='p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5'>
					<div className='flex items-center justify-between'>
						<div>
							<span className='text-xs font-bold text-slate-800 dark:text-slate-200 block'>
								Sync Contacts & Groups
							</span>
							<span className='text-[11px] text-slate-500 dark:text-slate-400'>
								Fetch connected chats directly from {CHANNEL_DISPLAY_NAMES[providerKey]}
							</span>
						</div>
						<button
							type='button'
							onClick={handleSync}
							disabled={isSyncing}
							className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-60 shadow-xs'
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0073ea]' : ''}`} />
							<span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
						</button>
					</div>

					{providerKey === 'telegram' && (
						<div className='text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-white/70 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 leading-relaxed'>
							<p className='font-semibold text-slate-700 dark:text-slate-300'>
								How to sync Telegram chats:
							</p>
							<ul className='list-disc pl-4 space-y-0.5'>
								<li>
									For private chats: Send a message (e.g. <code>/start</code>) directly to your bot.
								</li>
								<li>
									For groups or channels: Add the bot as an admin/member, send a message (e.g.{' '}
									<code>/sync</code> or mention <code>@botname</code>), then click{' '}
									<strong>Sync Now</strong>.
								</li>
							</ul>
						</div>
					)}
				</div>
			)}

			{!supportsSync && (
				<div className='p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2'>
					<span className='text-xs font-bold text-slate-800 dark:text-slate-200 block'>
						{providerKey === 'email' ? 'Add Email Target' : 'Add Webhook Target'}
					</span>

					{providerKey === 'email' ? (
						<div className='flex gap-2'>
							<input
								type='email'
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder='Enter email address (e.g. alerts@company.com)...'
								className='flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
							/>
							<button
								type='button'
								onClick={handleAddEmail}
								disabled={isCreating || !newEmail.trim()}
								className='px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0073ea] hover:bg-[#005bb5] text-white transition-all cursor-pointer disabled:opacity-50 shrink-0'
							>
								{isCreating ? 'Adding...' : 'Add Target'}
							</button>
						</div>
					) : (
						<div className='space-y-2'>
							<input
								type='text'
								value={newWebhookName}
								onChange={(e) => setNewWebhookName(e.target.value)}
								placeholder='Display Name (e.g. #alerts-channel)...'
								className='w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
							/>
							<div className='flex gap-2'>
								<input
									type='text'
									value={newWebhookUrl}
									onChange={(e) => setNewWebhookUrl(e.target.value)}
									placeholder='Webhook URL (starts with https://)...'
									className='flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
								/>
								<button
									type='button'
									onClick={handleAddWebhook}
									disabled={isCreating || !newWebhookName.trim() || !newWebhookUrl.trim()}
									className='px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0073ea] hover:bg-[#005bb5] text-white transition-all cursor-pointer disabled:opacity-50 shrink-0'
								>
									{isCreating ? 'Adding...' : 'Add Target'}
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			<div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>
						Available Targets
					</span>
					{destinations.length > 0 && (
						<span
							className={`text-[11px] font-semibold ${
								selectedIds.length === 0
									? 'text-amber-600 dark:text-amber-400'
									: 'text-slate-500 dark:text-slate-400'
							}`}
						>
							{selectedIds.length} of {destinations.length} selected
						</span>
					)}
				</div>

				{destinations.length > 0 && (
					<div className='flex items-center gap-2'>
						<div className='relative flex-1'>
							<Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
							<input
								type='text'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder='Search targets by name or ID...'
								className='w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
							/>
						</div>

						{supportsSync && (
							<div ref={filterRef} className='relative shrink-0'>
								<button
									type='button'
									onClick={() => setIsFilterOpen((prev) => !prev)}
									className='h-8 flex items-center justify-between gap-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left text-xs text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#0073ea] transition-all cursor-pointer'
								>
									<div className='flex items-center gap-1.5'>
										<span className='font-semibold'>{activeOption.label}</span>
										<span className='text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase'>
											{activeOption.count}
										</span>
									</div>
									<ChevronDown
										className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
									/>
								</button>

								{isFilterOpen && (
									<div className='absolute right-0 top-full mt-1.5 z-40 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-100'>
										<div className='divide-y divide-slate-100 dark:divide-slate-700/40'>
											{filterOptions.map((opt) => {
												const isSelected = typeFilter === opt.key;
												return (
													<div
														key={opt.key}
														onClick={() => {
															setTypeFilter(opt.key);
															setIsFilterOpen(false);
														}}
														className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
															isSelected
																? 'bg-blue-50/60 dark:bg-sky-950/40 text-[#0073ea]'
																: 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
														}`}
													>
														<div className='flex items-center gap-2'>
															<span className='font-semibold text-xs'>{opt.label}</span>
															<span
																className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${opt.badgeColor}`}
															>
																{opt.count}
															</span>
														</div>
														{isSelected && (
															<Check className='w-3.5 h-3.5 text-[#0073ea] shrink-0' />
														)}
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{destinations.length > 0 && selectedIds.length === 0 && (
					<p className='text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-0.5'>
						<AlertCircle className='w-3.5 h-3.5 shrink-0' />
						<span>
							Select at least one destination target for {CHANNEL_DISPLAY_NAMES[providerKey] || 'notifications'}.
						</span>
					</p>
				)}

				{isLoading ? (
					<div className='p-4 text-center text-xs text-slate-400 space-y-2'>
						<div className='h-9 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
						<div className='h-9 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
					</div>
				) : destinations.length === 0 ? (
					<div className='p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300'>
						<AlertCircle className='w-4 h-4 shrink-0' />
						<span>
							No destination targets configured yet. Add a target above
							{supportsSync ? ' or click Sync Now' : ''}.
						</span>
					</div>
				) : (
					<div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs'>
						{filteredDestinations.length === 0 ? (
							<div className='p-4 text-center text-xs text-slate-400'>No targets match your search</div>
						) : (
							filteredDestinations.map((dest) => {
								const isSelected = selectedIds.includes(dest.id);
								return (
									<div
										key={dest.id}
										onClick={() => handleToggle(dest.id)}
										className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
											isSelected
												? 'bg-blue-50/70 dark:bg-sky-950/40 text-[#0073ea]'
												: 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
										}`}
									>
										<div className='flex items-center gap-2.5 min-w-0 flex-1'>
											<div
												className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
													isSelected
														? 'bg-[#0073ea] border-[#0073ea] text-white'
														: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
												}`}
											>
												{isSelected && <Check className='w-3 h-3' strokeWidth={3} />}
											</div>
											<div className='min-w-0 flex-1'>
												<div className='flex items-center gap-2 flex-wrap'>
													<span className='font-semibold text-xs text-slate-900 dark:text-slate-100 truncate'>
														{dest.display_name}
													</span>
													<span
														className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${
															dest.type === 'chat'
																? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
																: dest.type === 'group'
																	? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
																	: dest.type === 'channel'
																		? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
																		: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
														}`}
													>
														{dest.type === 'chat'
															? 'Personal'
															: dest.type === 'group'
																? 'Group'
																: dest.type === 'channel'
																	? 'Channel'
																	: dest.type}
													</span>
													<span
														className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${
															dest.source === 'sync'
																? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
																: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
														}`}
													>
														{dest.source === 'sync' ? 'Synced' : 'Manual'}
													</span>
												</div>
												<div className='text-[11px] text-slate-400 font-mono truncate mt-0.5'>
													{dest.external_id}
												</div>
											</div>
										</div>

										{dest.source === 'manual' && (
											<button
												type='button'
												onClick={(e) => handleDelete(dest.id, e)}
												className='p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0'
												title='Delete target'
											>
												<Trash2 className='w-3.5 h-3.5' />
											</button>
										)}
									</div>
								);
							})
						)}
					</div>
				)}
			</div>
		</div>
	);
};

interface NotificationRuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	rule?: INotificationEvent | null;
	availableEvents: INotificationEvent[];
}

export const NotificationRuleModal: React.FC<NotificationRuleModalProps> = ({
	isOpen,
	onClose,
	rule,
	availableEvents,
}) => {
	const [mounted, setMounted] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<string>('');
	const [eventSearch, setEventSearch] = useState<string>('');
	const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
	const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
	const [channels, setChannels] = useState<INotificationChannelConfig[]>([]);

	const [isRecipientsDropdownOpen, setIsRecipientsDropdownOpen] = useState(false);
	const [recipientTab, setRecipientTab] = useState<'role' | 'individual'>('role');
	const [recipientSearch, setRecipientSearch] = useState('');
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const [portalPosition, setPortalPosition] = useState<{
		top?: number;
		bottom?: number;
		left: number;
		width: number;
		openUpward: boolean;
	}>({ left: 0, width: 0, openUpward: false });

	const eventDropdownRef = useRef<HTMLDivElement>(null);
	const addChannelRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const { data: providers } = useIntegrations();
	const { data: recipientsData } = useRecipientsOptions();
	const updateMutation = useUpdateNotificationEvent();

	const connectedProviders = (providers || []).filter((p) => p.status === 'CONNECTED');
	const rolesList = recipientsData?.roles || [];
	const usersList = recipientsData?.users || [];

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (rule) {
			setSelectedEventId(rule.id);
			const ruleChannels = rule.channels || [];
			if (!ruleChannels.some((c) => c.channel_type === 'in_app')) {
				setChannels([
					{
						channel_type: 'in_app',
						name: 'In-App Notification',
						is_enabled: true,
						recipient: '',
						recipient_roles: [],
						recipient_users: [],
					},
					...ruleChannels,
				]);
			} else {
				setChannels(ruleChannels);
			}

			const inAppChan = ruleChannels.find((c) => c.channel_type === 'in_app');
			setSelectedRoles(inAppChan?.recipient_roles || []);
			setSelectedUsers(inAppChan?.recipient_users || []);
		} else {
			setSelectedEventId(availableEvents[0]?.id || '');
			setChannels([
				{
					channel_type: 'in_app',
					name: 'In-App Notification',
					is_enabled: true,
					recipient: '',
					recipient_roles: [],
					recipient_users: [],
				},
			]);
			setSelectedRoles([]);
			setSelectedUsers([]);
		}
		setEventSearch('');
		setIsEventDropdownOpen(false);
		setIsAddChannelOpen(false);
		setIsRecipientsDropdownOpen(false);
		setRecipientSearch('');
	}, [rule, isOpen]);

	const updatePosition = () => {
		if (!triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const shouldOpenUpward = spaceBelow < 300 && spaceAbove > spaceBelow;

		if (shouldOpenUpward) {
			setPortalPosition({
				bottom: window.innerHeight - rect.top + 6,
				left: rect.left,
				width: rect.width,
				openUpward: true,
			});
		} else {
			setPortalPosition({
				top: rect.bottom + 6,
				left: rect.left,
				width: rect.width,
				openUpward: false,
			});
		}
	};

	useEffect(() => {
		if (!isRecipientsDropdownOpen) return;
		updatePosition();

		const handleScrollOrResize = () => {
			updatePosition();
		};

		window.addEventListener('scroll', handleScrollOrResize, true);
		window.addEventListener('resize', handleScrollOrResize);

		return () => {
			window.removeEventListener('scroll', handleScrollOrResize, true);
			window.removeEventListener('resize', handleScrollOrResize);
		};
	}, [isRecipientsDropdownOpen]);

	useEffect(() => {
		const handleGlobalClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (isEventDropdownOpen && eventDropdownRef.current && !eventDropdownRef.current.contains(target)) {
				setIsEventDropdownOpen(false);
			}
			if (isAddChannelOpen && addChannelRef.current && !addChannelRef.current.contains(target)) {
				setIsAddChannelOpen(false);
			}
			if (
				isRecipientsDropdownOpen &&
				dropdownRef.current &&
				!dropdownRef.current.contains(target) &&
				triggerRef.current &&
				!triggerRef.current.contains(target)
			) {
				setIsRecipientsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleGlobalClick);
		return () => {
			document.removeEventListener('mousedown', handleGlobalClick);
		};
	}, [isEventDropdownOpen, isAddChannelOpen, isRecipientsDropdownOpen]);

	if (!isOpen) return null;

	const currentEvent = availableEvents.find((e) => e.id === selectedEventId);

	const filteredEvents = availableEvents.filter((ev) => {
		if (!eventSearch) return true;
		const s = eventSearch.toLowerCase();
		return (
			ev.name.toLowerCase().includes(s) ||
			ev.event_code.toLowerCase().includes(s) ||
			ev.category.toLowerCase().includes(s) ||
			(ev.description || '').toLowerCase().includes(s)
		);
	});

	const filteredRoles = rolesList.filter((r) => r.name.toLowerCase().includes(recipientSearch.toLowerCase()));

	const filteredUsers = usersList.filter((u) => {
		const s = recipientSearch.toLowerCase();
		return (
			u.name.toLowerCase().includes(s) ||
			u.email.toLowerCase().includes(s) ||
			(u.role_name || '').toLowerCase().includes(s)
		);
	});

	const toggleRecipientsDropdown = () => {
		if (!isRecipientsDropdownOpen) {
			updatePosition();
			setIsRecipientsDropdownOpen(true);
		} else {
			setIsRecipientsDropdownOpen(false);
		}
	};

	const handleAddChannel = (channelType: string, displayName: string) => {
		if (channels.some((c) => c.channel_type === channelType)) {
			toast.info(`${displayName} is already added`);
			setIsAddChannelOpen(false);
			return;
		}

		setChannels((prev) => [
			...prev,
			{
				channel_type: channelType,
				name: displayName,
				is_enabled: true,
				recipient: '',
				destination_ids: [],
			},
		]);
		setIsAddChannelOpen(false);
	};

	const handleRemoveChannel = (channelType: string) => {
		if (channelType === 'in_app') {
			toast.info('In-App Notification channel is required for alert feeds');
			return;
		}
		setChannels((prev) => prev.filter((c) => c.channel_type !== channelType));
	};

	const handleUpdateChannelDestinations = (channelType: string, destinationIds: string[], summary: string) => {
		setChannels((prev) =>
			prev.map((c) =>
				c.channel_type === channelType ? { ...c, destination_ids: destinationIds, recipient: summary } : c,
			),
		);
	};

	const handleToggleRole = (roleName: string) => {
		const next = selectedRoles.includes(roleName)
			? selectedRoles.filter((r) => r !== roleName)
			: [...selectedRoles, roleName];
		setSelectedRoles(next);

		setChannels((prev) =>
			prev.map((c) => {
				if (c.channel_type === 'in_app') {
					return {
						...c,
						recipient_roles: next,
						recipient: [...next.map((r) => `Role: ${r}`), ...selectedUsers.map((u) => `User: ${u}`)].join(
							', ',
						),
					};
				}
				return c;
			}),
		);
	};

	const handleToggleUser = (userName: string) => {
		const next = selectedUsers.includes(userName)
			? selectedUsers.filter((u) => u !== userName)
			: [...selectedUsers, userName];
		setSelectedUsers(next);

		setChannels((prev) =>
			prev.map((c) => {
				if (c.channel_type === 'in_app') {
					return {
						...c,
						recipient_users: next,
						recipient: [...selectedRoles.map((r) => `Role: ${r}`), ...next.map((u) => `User: ${u}`)].join(
							', ',
						),
					};
				}
				return c;
			}),
		);
	};

	const isEventValid = Boolean(selectedEventId || rule);
	const inAppHasRecipients = selectedRoles.length > 0 || selectedUsers.length > 0;
	const externalChannels = channels.filter((c) => c.channel_type !== 'in_app');
	const invalidExternal = externalChannels.filter(
		(c) => !c.destination_ids || c.destination_ids.length === 0,
	);
	const hasConfiguredExternal = externalChannels.some(
		(c) => (c.destination_ids || []).length > 0,
	);
	const hasAtLeastOneValue = inAppHasRecipients || hasConfiguredExternal;
	const isFormValid = isEventValid && hasAtLeastOneValue && invalidExternal.length === 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedEventId && !rule) {
			toast.error('Please select an event trigger');
			return;
		}

		if (invalidExternal.length > 0) {
			const names = invalidExternal
				.map((c) => CHANNEL_DISPLAY_NAMES[c.channel_type] || c.name)
				.join(', ');
			toast.error(`Please select at least one destination target for ${names}`);
			return;
		}

		if (!hasAtLeastOneValue) {
			toast.error(
				'Please select at least one recipient for in-app notification or select integration targets',
			);
			return;
		}

		const finalChannels = channels.map((c) => {
			if (c.channel_type === 'in_app') {
				const hasRecipients = selectedRoles.length > 0 || selectedUsers.length > 0;
				return {
					...c,
					is_enabled: hasRecipients,
					recipient_roles: selectedRoles,
					recipient_users: selectedUsers,
					recipient: hasRecipients
						? [
								...selectedRoles.map((r) => `Role: ${r}`),
								...selectedUsers.map((u) => `User: ${u}`),
						  ].join(', ')
						: '',
				};
			}
			return c;
		});

		const targetId = rule ? rule.id : selectedEventId;

		updateMutation.mutate(
			{
				id: targetId,
				channels: finalChannels,
			},
			{
				onSuccess: () => {
					toast.success('Notification rule saved successfully');
					onClose();
				},
				onError: (err: any) => {
					toast.error(err.message || 'Failed to update notification rule');
				},
			},
		);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'>
			<div className='relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'>
				<div className='flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0'>
					<div className='flex items-center gap-3'>
						<div className='p-2.5 rounded-xl bg-blue-50 dark:bg-sky-950/40 text-[#0073ea] dark:text-sky-400 border border-blue-100 dark:border-sky-900/50'>
							<Bell className='w-5 h-5' />
						</div>
						<div>
							<h2 className='text-base font-bold text-slate-900 dark:text-white'>
								{rule ? 'Edit Notification Rule' : 'Create Notification Rule'}
							</h2>
							<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
								Configure notification delivery for an event
							</p>
						</div>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				<form
					id='notification-rule-form'
					onSubmit={handleSubmit}
					className='p-6 space-y-6 overflow-y-auto flex-1 min-h-0'
				>
					<div className='space-y-2'>
						<label className='text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1'>
							Event Type <span className='text-red-500'>*</span>
						</label>

						{!rule ? (
							<div ref={eventDropdownRef} className='relative'>
								<button
									type='button'
									onClick={() => setIsEventDropdownOpen((prev) => !prev)}
									className='w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left text-xs text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all cursor-pointer'
								>
									{currentEvent ? (
										<div className='flex items-center gap-2 truncate'>
											<span className='font-semibold'>{currentEvent.name}</span>
											<span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase'>
												{currentEvent.category}
											</span>
										</div>
									) : (
										<span className='text-slate-400'>Select an event trigger</span>
									)}
									<ChevronDown className='w-4 h-4 text-slate-400 shrink-0 ml-2' />
								</button>

								{isEventDropdownOpen && (
									<div className='absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100'>
										<div className='p-2 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/80'>
											<div className='relative'>
												<Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
												<input
													type='text'
													value={eventSearch}
													onChange={(e) => setEventSearch(e.target.value)}
													placeholder='Search events by name, code, category...'
													className='w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
													autoFocus
												/>
											</div>
										</div>

										<div className='max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40 p-1'>
											{filteredEvents.length === 0 ? (
												<div className='p-4 text-center text-xs text-slate-400'>
													No events found
												</div>
											) : (
												filteredEvents.map((ev) => (
													<div
														key={ev.id}
														onClick={() => {
															setSelectedEventId(ev.id);
															setIsEventDropdownOpen(false);
														}}
														className={`p-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
															selectedEventId === ev.id
																? 'bg-blue-50/60 dark:bg-sky-950/40 text-[#0073ea]'
																: ''
														}`}
													>
														<div className='min-w-0 pr-2'>
															<div className='flex items-center gap-2'>
																<span className='font-semibold text-xs text-slate-900 dark:text-slate-100'>
																	{ev.name}
																</span>
																<span className='text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase'>
																	{ev.category}
																</span>
															</div>
															<div className='text-[11px] text-slate-400 font-mono mt-0.5 truncate'>
																{ev.event_code}
															</div>
														</div>
														{selectedEventId === ev.id && (
															<Check className='w-4 h-4 text-[#0073ea] shrink-0' />
														)}
													</div>
												))
											)}
										</div>
									</div>
								)}
							</div>
						) : (
							<div className='p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'>
								<div className='flex items-center gap-2'>
									<span className='text-xs font-bold text-slate-900 dark:text-white'>
										{rule.name}
									</span>
									<span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase'>
										{rule.category}
									</span>
								</div>
								<p className='text-[11px] text-slate-500 font-mono mt-1'>{rule.event_code}</p>
								{rule.description && (
									<p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
										{rule.description}
									</p>
								)}
							</div>
						)}
					</div>

					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='text-xs font-bold text-slate-900 dark:text-white'>Delivery Channels</h3>
								<p className='text-[11px] text-slate-500 dark:text-slate-400'>
									Configure where notifications are sent
								</p>
							</div>

							<div ref={addChannelRef} className='relative'>
								<button
									type='button'
									onClick={() => setIsAddChannelOpen((prev) => !prev)}
									className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 shadow-xs transition-colors cursor-pointer'
								>
									<Plus className='w-3.5 h-3.5' />
									<span>Add Channel</span>
								</button>

								{isAddChannelOpen && (
									<div className='absolute right-0 top-full mt-1.5 z-40 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden py-1'>
										<div className='px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400'>
											Connected Integrations
										</div>

										{connectedProviders.length === 0 ? (
											<div className='px-3 py-2 text-xs text-slate-400 italic'>
												No integrations connected
											</div>
										) : (
											connectedProviders.map((p) => {
												const Icon = CHANNEL_ICON_MAP[p.provider_key] || Send;
												return (
													<button
														key={p.provider_key}
														type='button'
														onClick={() =>
															handleAddChannel(
																p.provider_key,
																CHANNEL_DISPLAY_NAMES[p.provider_key] || p.display_name,
															)
														}
														className='w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer'
													>
														<Icon className='w-3.5 h-3.5 text-slate-400' />
														<span>
															{CHANNEL_DISPLAY_NAMES[p.provider_key] || p.display_name}
														</span>
													</button>
												);
											})
										)}
									</div>
								)}
							</div>
						</div>

						{connectedProviders.length === 0 && (
							<div className='p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-1'>
								<p className='text-xs font-semibold text-amber-700 dark:text-amber-300'>
									No integrations connected
								</p>
								<p className='text-xs text-amber-600/90 dark:text-amber-400'>
									Connect third-party providers in{' '}
									<Link
										href='/integrations'
										className='font-semibold underline hover:text-amber-800 dark:hover:text-amber-200'
									>
										Integrations Configuration
									</Link>{' '}
									to enable additional channels.
								</p>
							</div>
						)}

						<div className='space-y-3'>
							{channels.map((ch) => {
								const Icon = CHANNEL_ICON_MAP[ch.channel_type] || Bell;
								const isInApp = ch.channel_type === 'in_app';

								return (
									<div
										key={ch.channel_type}
										className='p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 space-y-3'
									>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2.5'>
												<div className='p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'>
													<Icon className='w-4 h-4' />
												</div>
												<div>
													<h4 className='text-xs font-bold text-slate-900 dark:text-white'>
														{CHANNEL_DISPLAY_NAMES[ch.channel_type] || ch.name}
													</h4>
													<span className='text-[10px] font-bold text-emerald-600 dark:text-emerald-400'>
														Active
													</span>
												</div>
											</div>

											{!isInApp && (
												<button
													type='button'
													onClick={() => handleRemoveChannel(ch.channel_type)}
													className='p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer'
												>
													<Trash2 className='w-3.5 h-3.5' />
												</button>
											)}
										</div>

										{isInApp ? (
											<div className='space-y-1.5'>
												<div className='flex items-center justify-between'>
													<label className='text-[10px] font-bold uppercase tracking-wider text-slate-400 block'>
														Recipients
													</label>
													<span
														className={`text-[11px] font-semibold ${
															selectedRoles.length === 0 && selectedUsers.length === 0
																? 'text-amber-600 dark:text-amber-400'
																: 'text-slate-500 dark:text-slate-400'
														}`}
													>
														{selectedRoles.length + selectedUsers.length} selected
													</span>
												</div>

												<div className='relative'>
													<div
														ref={triggerRef}
														onClick={toggleRecipientsDropdown}
														className={`min-h-10 w-full p-2 rounded-xl border ${
															selectedRoles.length === 0 && selectedUsers.length === 0
																? 'border-amber-300 dark:border-amber-700/60'
																: 'border-slate-200 dark:border-slate-700'
														} bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors`}
													>
														{selectedRoles.length === 0 && selectedUsers.length === 0 ? (
															<span className='text-xs text-slate-400 px-1'>
																Select roles or users...
															</span>
														) : (
															<>
																{selectedRoles.map((r) => (
																	<span
																		key={r}
																		className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-sky-950/70 dark:text-sky-300 border border-blue-200 dark:border-sky-800/80 transition-all shadow-xs'
																	>
																		<Users className='w-3 h-3 text-[#0073ea]' />
																		<span>{r}</span>
																		<button
																			type='button'
																			onClick={(e) => {
																				e.stopPropagation();
																				handleToggleRole(r);
																			}}
																			className='hover:text-red-500 p-0.5 rounded transition-colors'
																		>
																			<X className='w-3 h-3' />
																		</button>
																	</span>
																))}
																{selectedUsers.map((u) => (
																	<span
																		key={u}
																		className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-all shadow-xs'
																	>
																		<UserIcon className='w-3 h-3 text-emerald-600' />
																		<span>{u}</span>
																		<button
																			type='button'
																			onClick={(e) => {
																				e.stopPropagation();
																				handleToggleUser(u);
																			}}
																			className='hover:text-red-500 p-0.5 rounded transition-colors'
																		>
																			<X className='w-3 h-3' />
																		</button>
																	</span>
																))}
															</>
														)}
														<Users className='w-4 h-4 text-slate-400 ml-auto shrink-0' />
													</div>

													{mounted &&
														isRecipientsDropdownOpen &&
														typeof document !== 'undefined' &&
														createPortal(
															<div
																ref={dropdownRef}
																style={{
																	position: 'fixed',
																	left: `${portalPosition.left}px`,
																	width: `${portalPosition.width}px`,
																	...(portalPosition.openUpward
																		? { bottom: `${portalPosition.bottom}px` }
																		: { top: `${portalPosition.top}px` }),
																	zIndex: 9999,
																}}
																className='bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150'
															>
																<div className='p-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800'>
																	<div className='p-1 bg-slate-200/70 dark:bg-slate-950/60 rounded-xl flex gap-1'>
																		<button
																			type='button'
																			onClick={() => setRecipientTab('role')}
																			className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
																				recipientTab === 'role'
																					? 'bg-white dark:bg-slate-800 text-[#0073ea] dark:text-sky-300 shadow-xs font-bold'
																					: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
																			}`}
																		>
																			<Users className='w-3.5 h-3.5' />
																			<span>By Role ({rolesList.length})</span>
																		</button>
																		<button
																			type='button'
																			onClick={() =>
																				setRecipientTab('individual')
																			}
																			className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
																				recipientTab === 'individual'
																					? 'bg-white dark:bg-slate-800 text-[#0073ea] dark:text-sky-300 shadow-xs font-bold'
																					: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
																			}`}
																		>
																			<UserIcon className='w-3.5 h-3.5' />
																			<span>Individual ({usersList.length})</span>
																		</button>
																	</div>
																</div>

																<div className='p-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'>
																	<div className='relative'>
																		<Search className='w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
																		<input
																			type='text'
																			value={recipientSearch}
																			onChange={(e) =>
																				setRecipientSearch(e.target.value)
																			}
																			placeholder={
																				recipientTab === 'role'
																					? 'Search roles...'
																					: 'Search users by name, email, or role...'
																			}
																			className='w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea]'
																			autoFocus
																		/>
																	</div>
																</div>

																<div className='max-h-48 overflow-y-auto p-1.5 space-y-1'>
																	{recipientTab === 'role' ? (
																		filteredRoles.length === 0 ? (
																			<div className='p-6 text-center text-xs text-slate-400'>
																				No roles found
																			</div>
																		) : (
																			filteredRoles.map((r) => {
																				const isChecked =
																					selectedRoles.includes(r.name);
																				return (
																					<div
																						key={r.id}
																						onClick={() =>
																							handleToggleRole(r.name)
																						}
																						className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
																							isChecked
																								? 'bg-blue-50/80 dark:bg-sky-950/50 border border-blue-200/80 dark:border-sky-800/60'
																								: 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
																						}`}
																					>
																						<div className='flex items-center gap-2.5 min-w-0'>
																							<div
																								className={`p-1.5 rounded-lg shrink-0 transition-colors ${
																									isChecked
																										? 'bg-[#0073ea] text-white'
																										: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
																								}`}
																							>
																								<Users className='w-3.5 h-3.5' />
																							</div>
																							<div className='truncate'>
																								<div
																									className={`text-xs font-semibold truncate ${
																										isChecked
																											? 'text-[#0073ea] dark:text-sky-300 font-bold'
																											: 'text-slate-900 dark:text-white'
																									}`}
																								>
																									{r.name}
																								</div>
																								<div className='text-[11px] text-slate-400'>
																									{r.user_count}{' '}
																									{r.user_count === 1
																										? 'user'
																										: 'users'}
																								</div>
																							</div>
																						</div>
																						<div
																							className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
																								isChecked
																									? 'bg-[#0073ea] border-[#0073ea] text-white'
																									: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
																							}`}
																						>
																							{isChecked && (
																								<Check
																									className='w-3.5 h-3.5'
																									strokeWidth={3}
																								/>
																							)}
																						</div>
																					</div>
																				);
																			})
																		)
																	) : filteredUsers.length === 0 ? (
																		<div className='p-6 text-center text-xs text-slate-400'>
																			No users found
																		</div>
																	) : (
																		filteredUsers.map((u) => {
																			const isChecked = selectedUsers.includes(
																				u.name,
																			);
																			return (
																				<div
																					key={u.id}
																					onClick={() =>
																						handleToggleUser(u.name)
																					}
																					className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
																						isChecked
																							? 'bg-blue-50/80 dark:bg-sky-950/50 border border-blue-200/80 dark:border-sky-800/60'
																							: 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
																					}`}
																				>
																					<div className='flex items-center gap-2.5 min-w-0'>
																						<div
																							className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
																								isChecked
																									? 'bg-[#0073ea] text-white'
																									: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
																							}`}
																						>
																							{u.name
																								.charAt(0)
																								.toUpperCase()}
																						</div>
																						<div className='truncate'>
																							<div
																								className={`text-xs font-semibold truncate ${
																									isChecked
																										? 'text-[#0073ea] dark:text-sky-300 font-bold'
																										: 'text-slate-900 dark:text-white'
																								}`}
																							>
																								{u.name}
																							</div>
																							<div className='text-[11px] text-slate-400 truncate'>
																								{u.email}{' '}
																								{u.role_name
																									? `• ${u.role_name}`
																									: ''}
																							</div>
																						</div>
																					</div>
																					<div
																						className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
																							isChecked
																								? 'bg-[#0073ea] border-[#0073ea] text-white'
																								: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
																						}`}
																					>
																						{isChecked && (
																							<Check
																								className='w-3.5 h-3.5'
																								strokeWidth={3}
																							/>
																						)}
																					</div>
																				</div>
																			);
																		})
																	)}
																</div>

																<div className='p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between'>
																	<span className='text-[11px] text-slate-500 dark:text-slate-400 px-1 font-semibold'>
																		{selectedRoles.length + selectedUsers.length}{' '}
																		selected
																	</span>
																	<button
																		type='button'
																		onClick={() =>
																			setIsRecipientsDropdownOpen(false)
																		}
																		className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0073ea] hover:bg-[#005bb5] text-white cursor-pointer transition-colors'
																	>
																		Done
																	</button>
																</div>
															</div>,
															document.body,
														)}
												</div>

												{selectedRoles.length === 0 && selectedUsers.length === 0 && (
													<p className='text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-0.5'>
														<AlertCircle className='w-3.5 h-3.5 shrink-0' />
														<span>Select at least one role or user for in-app notifications.</span>
													</p>
												)}
											</div>
										) : (
											<IntegrationTargetPicker
												providerKey={ch.channel_type}
												selectedIds={ch.destination_ids || []}
												onChangeSelectedIds={(ids, summary) =>
													handleUpdateChannelDestinations(ch.channel_type, ids, summary)
												}
											/>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</form>

				<div className='p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3 shrink-0'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer'
					>
						Cancel
					</button>
					<button
						type='submit'
						form='notification-rule-form'
						disabled={updateMutation.isPending || !isFormValid}
						className='px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{updateMutation.isPending ? 'Saving...' : rule ? 'Save Changes' : 'Create Rule'}
					</button>
				</div>
			</div>
		</div>
	);
};
