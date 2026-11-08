'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/store/api/notifications';
import { formatDistanceToNow } from 'date-fns';
import { formatToWIB } from '@/utils/common';

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

export const NotificationBell: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const { data: notifData } = useNotifications(1, 15, false);
	const markReadMutation = useMarkNotificationRead();
	const markAllReadMutation = useMarkAllNotificationsRead();

	const unreadCount = notifData?.unread_count || 0;
	const notifications = notifData?.data || [];

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		markReadMutation.mutate(id);
	};

	const handleMarkAllRead = (e: React.MouseEvent) => {
		e.stopPropagation();
		markAllReadMutation.mutate();
	};

	return (
		<div className='relative' ref={containerRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='relative flex items-center justify-center size-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer'
				title='Notifications & Incident Alerts'
				aria-label='Notifications'
			>
				<Bell className='size-5' />
				{unreadCount > 0 && (
					<span className='absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-xs'>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div className='absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150'>
					<div className='flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'>
						<div className='flex items-center gap-2'>
							<h3 className='text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider'>
								Incident Alerts
							</h3>
							{unreadCount > 0 && (
								<span className='px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'>
									{unreadCount} new
								</span>
							)}
						</div>

						{unreadCount > 0 && (
							<button
								onClick={handleMarkAllRead}
								disabled={markAllReadMutation.isPending}
								className='text-[11px] font-medium text-[#0073ea] hover:text-[#0060c5] dark:text-sky-400 hover:underline cursor-pointer'
							>
								Mark all read
							</button>
						)}
					</div>

					<div className='max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60'>
						{notifications.length === 0 ? (
							<div className='p-8 text-center text-slate-400 dark:text-slate-500 text-xs'>
								<Bell className='w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400' />
								<p className='font-medium'>No incident alerts recorded yet.</p>
								<p className='text-[11px] text-slate-400 mt-0.5'>
									Realtime downtime alerts will appear here.
								</p>
							</div>
						) : (
							notifications.map((notif) => {
								let timeStr = '';
								let exactWib = '';
								try {
									const raw = notif.created_at;
									const normalized = raw && !raw.endsWith('Z') && !raw.includes('+') ? `${raw}Z` : raw;
									timeStr = formatDistanceToNow(new Date(normalized), {
										addSuffix: true,
									});
									exactWib = formatToWIB(normalized);
								} catch {
									timeStr = notif.created_at;
									exactWib = notif.created_at;
								}

								return (
									<div
										key={notif.id}
										onClick={() => {
											if (!notif.is_read) {
												markReadMutation.mutate(notif.id);
											}
										}}
										className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
											notif.is_read
												? 'bg-white dark:bg-slate-900 opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/50'
												: 'bg-blue-50/40 dark:bg-sky-950/20 hover:bg-blue-50/70 dark:hover:bg-sky-950/40'
										}`}
									>
										<div className='flex items-center justify-between gap-2'>
											<div className='flex items-center gap-1.5 min-w-0'>
												<span className='font-semibold text-xs text-slate-900 dark:text-slate-100 truncate'>
													{cleanTitle(notif.title)}
												</span>
												{!notif.is_read && (
													<span className='w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0' />
												)}
											</div>
											<span className='text-[10px] text-slate-400 shrink-0' title={exactWib}>{timeStr}</span>
										</div>

										<p className='text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed'>
											{notif.body}
										</p>

										{notif.event_code && (
											<div className='flex items-center gap-2 mt-1'>
												<span className='px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'>
													{notif.event_code}
												</span>
											</div>
										)}
									</div>
								);
							})
						)}
					</div>

					<div className='p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center'>
						<Link
							href='/notifications'
							onClick={() => setIsOpen(false)}
							className='text-xs font-semibold text-[#0073ea] hover:text-[#0060c5] dark:text-sky-400 inline-flex items-center gap-1'
						>
							<span>View All Notifications</span>
							<ChevronRight className='w-3.5 h-3.5' />
						</Link>
					</div>
				</div>
			)}
		</div>
	);
};
