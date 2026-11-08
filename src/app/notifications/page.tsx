'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
	useNotifications,
	useNotificationEvents,
	useMarkNotificationRead,
	useMarkAllNotificationsRead,
	useDeleteNotificationEvent,
} from '@/store/api/notifications';
import { NotificationRuleModal } from '@/components/notifications/NotificationRuleModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, ColumnDef, IPaginationData } from '@/components/ui';
import { INotificationEvent } from '@/types/notifications';
import { useDebounce } from '@/hooks/useDebounce';
import {
	Bell,
	Send,
	Mail,
	Slack,
	Search,
	CheckCheck,
	Plus,
	SlidersHorizontal,
	MoreVertical,
	Pencil,
	Trash2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronDown,
	Server,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatToWIB } from '@/utils/common';
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
	discord: DiscordIcon,
	slack: Slack,
	email: Mail,
};

const cleanTitle = (raw: string): string => {
	if (!raw) return '';
	const withoutEmoji = raw.replace(/^[^\w\s\[\]]+\s*/u, '');
	const match = withoutEmoji.match(/^\[([^\]]+)\]\s*(.*)$/);
	if (match) {
		const tag = match[1]
			.toLowerCase()
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ')
			.replace('Nvr', 'NVR')
			.replace('Dvr', 'DVR')
			.replace('Cpu', 'CPU')
			.replace('Usb', 'USB');
		return match[2] ? `${tag} - ${match[2]}` : tag;
	}
	return withoutEmoji;
};

export default function NotificationsPage() {
	const [activeTab, setActiveTab] = useState<'rules' | 'feed'>('rules');
	const [ruleSearch, setRuleSearch] = useState<string>('');
	const debouncedRuleSearch = useDebounce(ruleSearch, 400);
	const [ruleModuleFilter, setRuleModuleFilter] = useState<string>('ALL');
	const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
	const [pageSize, setPageSize] = useState<number>(50);
	const [currentPage, setCurrentPage] = useState<number>(1);

	const [mounted, setMounted] = useState(false);
	const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
	const [editingRule, setEditingRule] = useState<INotificationEvent | null>(null);
	const [activeMenuRule, setActiveMenuRule] = useState<INotificationEvent | null>(null);
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		right: number;
		openUpward: boolean;
	} | null>(null);

	const [ruleToDelete, setRuleToDelete] = useState<INotificationEvent | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
	const [severityFilter, setSeverityFilter] = useState<string>('ALL');
	const [feedSearch, setFeedSearch] = useState<string>('');
	const debouncedFeedSearch = useDebounce(feedSearch, 400);
	const [feedPageSize, setFeedPageSize] = useState<number>(20);
	const [feedCurrentPage, setFeedCurrentPage] = useState<number>(1);

	const { data: notifData, isLoading: loadingNotifs } = useNotifications(
		feedCurrentPage,
		feedPageSize,
		false,
		{
			read_status: readFilter,
			severity: severityFilter,
			search: debouncedFeedSearch,
		}
	);

	const { data: eventsData, isLoading: loadingEvents } = useNotificationEvents(
		currentPage,
		pageSize,
		{
			search: debouncedRuleSearch,
			category: ruleModuleFilter,
			configured_only: true,
		}
	);

	const { data: allEventsData } = useNotificationEvents(1, 100);

	const markReadMutation = useMarkNotificationRead();
	const markAllReadMutation = useMarkAllNotificationsRead();
	const deleteMutation = useDeleteNotificationEvent();

	const notifications = notifData?.data || [];
	const unreadCount = notifData?.unread_count || 0;
	const totalNotifRecords = notifData?.total || 0;
	const totalFeedPages = Math.max(1, Math.ceil(totalNotifRecords / feedPageSize));

	const rules = eventsData?.data || [];
	const totalRules = eventsData?.total || 0;
	const totalPages = Math.max(1, Math.ceil(totalRules / pageSize));

	const isAllSelected = rules.length > 0 && rules.every((r) => selectedRuleIds.includes(r.id));

	const handleSelectAll = () => {
		if (isAllSelected) {
			setSelectedRuleIds([]);
		} else {
			setSelectedRuleIds(rules.map((r) => r.id));
		}
	};

	const handleToggleSelect = (id: string) => {
		setSelectedRuleIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
	};

	const handleDeleteRule = () => {
		if (!ruleToDelete) return;
		deleteMutation.mutate(ruleToDelete.id, {
			onSuccess: () => {
				toast.success('Notification rule deleted successfully');
				setRuleToDelete(null);
			},
			onError: (err: any) => {
				toast.error(err.message || 'Failed to delete notification rule');
			},
		});
	};

	useEffect(() => {
		const handleClose = () => {
			setActiveMenuRule(null);
			setMenuPosition(null);
		};
		if (activeMenuRule) {
			window.addEventListener('click', handleClose);
			window.addEventListener('scroll', handleClose, true);
			window.addEventListener('resize', handleClose);
		}
		return () => {
			window.removeEventListener('click', handleClose);
			window.removeEventListener('scroll', handleClose, true);
			window.removeEventListener('resize', handleClose);
		};
	}, [activeMenuRule]);

	const pagination: IPaginationData = {
		total_items: totalRules,
		total_pages: totalPages,
		current_page: currentPage,
		page_size: pageSize,
		showing_start: totalRules > 0 ? (currentPage - 1) * pageSize + 1 : 0,
		showing_end: Math.min(currentPage * pageSize, totalRules),
	};

	const getFeedPageNumbers = () => {
		const pages: (number | string)[] = [];
		if (totalFeedPages <= 7) {
			for (let i = 1; i <= totalFeedPages; i++) pages.push(i);
		} else {
			if (feedCurrentPage <= 4) {
				pages.push(1, 2, 3, 4, 5, '...', totalFeedPages);
			} else if (feedCurrentPage >= totalFeedPages - 3) {
				pages.push(
					1,
					'...',
					totalFeedPages - 4,
					totalFeedPages - 3,
					totalFeedPages - 2,
					totalFeedPages - 1,
					totalFeedPages,
				);
			} else {
				pages.push(
					1,
					'...',
					feedCurrentPage - 1,
					feedCurrentPage,
					feedCurrentPage + 1,
					'...',
					totalFeedPages,
				);
			}
		}
		return pages;
	};

	const feedShowingStart = totalNotifRecords > 0 ? (feedCurrentPage - 1) * feedPageSize + 1 : 0;
	const feedShowingEnd = Math.min(feedCurrentPage * feedPageSize, totalNotifRecords);

	const columns: ColumnDef<INotificationEvent>[] = [
		{
			id: 'name',
			header: 'Event Name',
			className: 'min-w-60',
			cell: (rule) => (
				<div className='space-y-0.5'>
					<div className='font-bold text-slate-900 dark:text-white'>
						{rule.name}
					</div>
					<div className='text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1'>
						{rule.description || rule.event_code}
					</div>
				</div>
			),
		},
		{
			id: 'category',
			header: 'Module',
			cell: (rule) => (
				<span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'>
					{rule.category}
				</span>
			),
		},
		{
			id: 'channels',
			header: 'Active Channels',
			cell: (rule) => {
				const channels = rule.channels || [];
				const activeChannels = channels.filter((c) => c.is_enabled);
				if (activeChannels.length === 0) {
					return <span className='text-slate-400 text-xs italic'>No channels</span>;
				}
				return (
					<div className='flex items-center gap-1.5 flex-wrap'>
						{activeChannels.map((ch, idx) => {
							const Icon = CHANNEL_ICONS[ch.channel_type] || Bell;
							return (
								<div
									key={idx}
									title={`${ch.name}${ch.recipient ? ` (${ch.recipient})` : ''}`}
									className='p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
								>
									<Icon className='w-3.5 h-3.5' />
								</div>
							);
						})}
					</div>
				);
			},
		},
		{
			id: 'action',
			header: 'Action',
			align: 'right',
			cell: (rule) => (
				<div className='relative inline-block text-left' onClick={(e) => e.stopPropagation()}>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							if (activeMenuRule?.id === rule.id) {
								setActiveMenuRule(null);
								setMenuPosition(null);
								return;
							}
							const rect = e.currentTarget.getBoundingClientRect();
							const spaceBelow = window.innerHeight - rect.bottom;
							const openUpward = spaceBelow < 120;
							setMenuPosition({
								top: openUpward ? rect.top - 6 : rect.bottom + 6,
								right: window.innerWidth - rect.right,
								openUpward,
							});
							setActiveMenuRule(rule);
						}}
						className='p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
					>
						<MoreVertical className='w-4 h-4' />
					</button>
				</div>
			),
		},
	];

	const headerActions = (
		<div className='flex items-center gap-2'>
			{activeTab === 'rules' && (
				<button
					type='button'
					onClick={() => {
						setEditingRule(null);
						setIsRuleModalOpen(true);
					}}
					className='inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-colors cursor-pointer'
				>
					<Plus className='w-4 h-4' />
					<span>Add Rule</span>
				</button>
			)}
			{unreadCount > 0 && activeTab === 'feed' && (
				<button
					type='button'
					onClick={() => markAllReadMutation.mutate()}
					disabled={markAllReadMutation.isPending}
					className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer disabled:opacity-50'
				>
					<CheckCheck className='w-3.5 h-3.5' />
					<span>Mark all as read</span>
				</button>
			)}
		</div>
	);

	return (
		<AppLayout title='Notifications & Alert Hub' headerRight={headerActions}>
			<div className='space-y-4'>

				<div className='flex border-b border-slate-200 dark:border-slate-800 gap-2'>
					<button
						onClick={() => setActiveTab('rules')}
						className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
							activeTab === 'rules'
								? 'border-[#0073ea] text-[#0073ea] dark:text-sky-400 dark:border-sky-400'
								: 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
						}`}
					>
						<SlidersHorizontal className='w-4 h-4' />
						<span>Notification Rules</span>
						<span className='px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
							{totalRules}
						</span>
					</button>

					<button
						onClick={() => setActiveTab('feed')}
						className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
							activeTab === 'feed'
								? 'border-[#0073ea] text-[#0073ea] dark:text-sky-400 dark:border-sky-400'
								: 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
						}`}
					>
						<Bell className='w-4 h-4' />
						<span>In-App Notifications</span>
						{unreadCount > 0 && (
							<span className='px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'>
								{unreadCount}
							</span>
						)}
					</button>
				</div>

				{activeTab === 'rules' && (
					<div className='space-y-4'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div className='relative flex-1 sm:w-64 max-w-sm'>
								<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
								<input
									type='text'
									value={ruleSearch}
									onChange={(e) => {
										setRuleSearch(e.target.value);
										setCurrentPage(1);
									}}
									placeholder='Search rules...'
									className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea] shadow-xs'
								/>
							</div>

							<div className='flex items-center gap-2.5 flex-wrap'>
								<div className='relative'>
									<select
										value={ruleModuleFilter}
										onChange={(e) => {
											setRuleModuleFilter(e.target.value);
											setCurrentPage(1);
										}}
										className='appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0073ea] cursor-pointer transition-colors shadow-xs'
									>
										<option value='ALL'>All Modules</option>
										<option value='cellular'>Cellular</option>
										<option value='dvr'>DVR</option>
										<option value='hardware'>Hardware</option>
										<option value='sla'>SLA</option>
										<option value='custom'>Custom</option>
									</select>
									<ChevronDown className='w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
								</div>
							</div>
						</div>

						<DataTable
							data={rules}
							columns={columns}
							keyField='id'
							enableSelection
							selectedIds={selectedRuleIds}
							onToggleSelectAll={handleSelectAll}
							onToggleSelectOne={handleToggleSelect}
							pagination={pagination}
							currentPage={currentPage}
							pageSize={pageSize}
							onPageChange={setCurrentPage}
							onPageSizeChange={(newSize) => {
								setPageSize(newSize);
								setCurrentPage(1);
							}}
							isLoading={loadingEvents}
							emptyMessage='No notification rules found'
						/>
					</div>
				)}

				{activeTab === 'feed' && (
					<div className='space-y-4'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div className='relative flex-1 sm:w-64 max-w-sm'>
								<Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
								<input
									type='text'
									value={feedSearch}
									onChange={(e) => {
										setFeedSearch(e.target.value);
										setFeedCurrentPage(1);
									}}
									placeholder='Search notifications...'
									className='w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea] shadow-xs'
								/>
							</div>

							<div className='flex items-center gap-2.5 flex-wrap'>
								<div className='relative'>
									<select
										value={readFilter}
										onChange={(e) => {
											setReadFilter(e.target.value as any);
											setFeedCurrentPage(1);
										}}
										className='appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0073ea] cursor-pointer transition-colors shadow-xs'
									>
										<option value='ALL'>All Status</option>
										<option value='UNREAD'>Unread</option>
										<option value='READ'>Read</option>
									</select>
									<ChevronDown className='w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
								</div>

								<div className='relative'>
									<select
										value={severityFilter}
										onChange={(e) => {
											setSeverityFilter(e.target.value);
											setFeedCurrentPage(1);
										}}
										className='appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0073ea] cursor-pointer transition-colors shadow-xs'
									>
										<option value='ALL'>All Severities</option>
										<option value='CRITICAL'>Critical</option>
										<option value='WARNING'>Warning</option>
										<option value='INFO'>Info</option>
									</select>
									<ChevronDown className='w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none' />
								</div>
							</div>
						</div>

						{loadingNotifs ? (
							<div className='p-12 text-center text-slate-400 text-sm'>Loading notifications...</div>
						) : notifications.length === 0 ? (
							<div className='p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl'>
								<Bell className='w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2' />
								<h3 className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
									No notifications found
								</h3>
								<p className='text-xs text-slate-400 mt-1'>
									Incident events matching your filters will be displayed here in real time.
								</p>
							</div>
						) : (
							<div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs'>
								<div className='p-4 space-y-2.5'>
									{notifications.map((notif) => {
										const isCritical = notif.severity === 'CRITICAL';
										const isWarning = notif.severity === 'WARNING';

										let timeAgo = '';
										let exactWib = '';
										try {
											const raw = notif.created_at;
											const normalized = raw && !raw.endsWith('Z') && !raw.includes('+') ? `${raw}Z` : raw;
											timeAgo = formatDistanceToNow(new Date(normalized), { addSuffix: true });
											exactWib = formatToWIB(normalized);
										} catch {
											timeAgo = notif.created_at;
											exactWib = notif.created_at;
										}

										return (
											<div
												key={notif.id}
												className={`p-4 rounded-xl border transition-all ${
													notif.is_read
														? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
														: 'bg-blue-50/30 dark:bg-sky-950/20 border-blue-200/80 dark:border-sky-800/60 shadow-xs'
												}`}
											>
												<div className='flex items-start justify-between gap-3'>
													<div className='space-y-1 min-w-0'>
														<div className='flex flex-wrap items-center gap-2'>
															<h4 className='text-sm font-semibold text-slate-900 dark:text-white'>
																{cleanTitle(notif.title)}
															</h4>
															<span
																className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
																	isCritical
																		? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
																		: isWarning
																			? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
																			: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
																}`}
															>
																{notif.severity}
															</span>
														</div>

														<p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed'>
															{notif.body}
														</p>
													</div>

													<div className='flex flex-col items-end gap-2 shrink-0'>
														<span className='text-xs text-slate-400' title={exactWib}>{timeAgo}</span>
														{!notif.is_read && (
															<button
																onClick={() => markReadMutation.mutate(notif.id)}
																className='text-xs font-semibold text-[#0073ea] hover:text-[#005bb5] dark:text-sky-400 hover:underline cursor-pointer'
															>
																Mark read
															</button>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>

								<div className='px-4 py-3 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1628]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0'>
									<div className='text-slate-500 dark:text-slate-400'>
										Showing{' '}
										<span className='font-semibold text-slate-800 dark:text-slate-200'>
											{feedShowingStart}
										</span>{' '}
										to{' '}
										<span className='font-semibold text-slate-800 dark:text-slate-200'>
											{feedShowingEnd}
										</span>{' '}
										of{' '}
										<span className='font-semibold text-slate-800 dark:text-slate-200'>
											{totalNotifRecords.toLocaleString()}
										</span>{' '}
										entries
									</div>

									<div className='flex flex-wrap items-center gap-3'>
										<div className='flex items-center gap-1.5 text-slate-500 dark:text-slate-400'>
											<span>Rows:</span>
											<div className='relative'>
												<select
													value={feedPageSize}
													onChange={(e) => {
														setFeedPageSize(Number(e.target.value));
														setFeedCurrentPage(1);
													}}
													className='appearance-none pl-2.5 pr-6 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#0073ea] cursor-pointer'
												>
													{[10, 20, 50, 100].map((opt) => (
														<option key={opt} value={opt}>
															{opt}
														</option>
													))}
												</select>
												<ChevronDown className='absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none' />
											</div>
										</div>

										<div className='flex items-center gap-1'>
											<button
												type='button'
												disabled={feedCurrentPage <= 1}
												onClick={() => setFeedCurrentPage(1)}
												title='First Page'
												className='size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer'
											>
												<ChevronsLeft className='size-3.5' />
											</button>

											<button
												type='button'
												disabled={feedCurrentPage <= 1}
												onClick={() => setFeedCurrentPage(Math.max(1, feedCurrentPage - 1))}
												title='Previous Page'
												className='size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer'
											>
												<ChevronLeft className='size-3.5' />
											</button>

											{getFeedPageNumbers().map((p, idx) => {
												if (typeof p === 'string') {
													return (
														<span
															key={`ellipsis-${idx}`}
															className='px-1 text-slate-400 dark:text-slate-600 select-none'
														>
															...
														</span>
													);
												}
												const isActive = p === feedCurrentPage;
												return (
													<button
														key={`page-${p}`}
														type='button'
														onClick={() => setFeedCurrentPage(p)}
														className={`size-7 rounded-md font-semibold text-xs flex items-center justify-center transition-all cursor-pointer ${
															isActive
																? 'bg-[#0073ea] text-white shadow-xs font-bold'
																: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
														}`}
													>
														{p}
													</button>
												);
											})}

											<button
												type='button'
												disabled={feedCurrentPage >= totalFeedPages}
												onClick={() => setFeedCurrentPage(Math.min(totalFeedPages, feedCurrentPage + 1))}
												title='Next Page'
												className='size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer'
											>
												<ChevronRight className='size-3.5' />
											</button>

											<button
												type='button'
												disabled={feedCurrentPage >= totalFeedPages}
												onClick={() => setFeedCurrentPage(totalFeedPages)}
												title='Last Page'
												className='size-7 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer'
											>
												<ChevronsRight className='size-3.5' />
											</button>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			<NotificationRuleModal
				isOpen={isRuleModalOpen}
				onClose={() => {
					setIsRuleModalOpen(false);
					setEditingRule(null);
				}}
				rule={editingRule}
				availableEvents={allEventsData?.data || []}
			/>

			<ConfirmDialog
				isOpen={Boolean(ruleToDelete)}
				title='Delete Notification Rule'
				description={`Are you sure you want to delete '${ruleToDelete?.name}'? This action cannot be undone.`}
				confirmLabel='Delete Rule'
				cancelLabel='Cancel'
				variant='danger'
				isLoading={deleteMutation.isPending}
				onConfirm={handleDeleteRule}
				onClose={() => setRuleToDelete(null)}
			/>

			{mounted && activeMenuRule && menuPosition && typeof document !== 'undefined' && createPortal(
				<div
					style={{
						position: 'fixed',
						right: `${menuPosition.right}px`,
						...(menuPosition.openUpward
							? { bottom: `${window.innerHeight - menuPosition.top}px` }
							: { top: `${menuPosition.top}px` }),
						zIndex: 9999,
					}}
					className='w-36 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100'
					onClick={(e) => e.stopPropagation()}
				>
					<button
						type='button'
						onClick={() => {
							const target = activeMenuRule;
							setActiveMenuRule(null);
							setMenuPosition(null);
							setEditingRule(target);
							setIsRuleModalOpen(true);
						}}
						className='w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer'
					>
						<Pencil className='w-3.5 h-3.5 text-slate-400' />
						<span>Edit Rule</span>
					</button>

					<button
						type='button'
						onClick={() => {
							const target = activeMenuRule;
							setActiveMenuRule(null);
							setMenuPosition(null);
							setRuleToDelete(target);
						}}
						className='w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer'
					>
						<Trash2 className='w-3.5 h-3.5 text-red-500' />
						<span>Delete Rule</span>
					</button>
				</div>,
				document.body
			)}
		</AppLayout>
	);
}
