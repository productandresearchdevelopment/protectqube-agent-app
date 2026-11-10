'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
	Users as UsersIcon,
	ShieldCheck,
	Layers,
	Bell,
	Boxes,
	ChevronRight,
} from 'lucide-react';
import { useCookies } from '@/hooks/useCookies';
import { UsersTab } from '@/components/configuration/users/UsersTab';
import { RolesTab } from '@/components/configuration/roles/RolesTab';
import { ModulesTab } from '@/components/configuration/modules/ModulesTab';
import { NotificationsTab } from '@/components/configuration/notifications/NotificationsTab';
import { IntegrationsTab } from '@/components/configuration/integrations/IntegrationsTab';

const COOKIE_KEY = 'system_config_tab';

interface ConfigMenuItem {
	id: string;
	label: string;
	description: string;
	icon: React.ElementType;
}

interface ConfigMenuGroup {
	label: string;
	items: ConfigMenuItem[];
}

const MENU_GROUPS: ConfigMenuGroup[] = [
	{
		label: 'Access Control',
		items: [
			{
				id: 'users',
				label: 'Users',
				description: 'Operator credentials & roles',
				icon: UsersIcon,
			},
			{
				id: 'roles',
				label: 'Roles & Permissions',
				description: 'RBAC rules & module matrix',
				icon: ShieldCheck,
			},
		],
	},
	{
		label: 'System Setup',
		items: [
			{
				id: 'modules',
				label: 'Modules',
				description: 'Routes, types & features',
				icon: Layers,
			},
		],
	},
	{
		label: 'Channels & Alerts',
		items: [
			{
				id: 'notifications',
				label: 'Notifications',
				description: 'Alert rules & delivery logs',
				icon: Bell,
			},
			{
				id: 'integrations',
				label: 'Integrations',
				description: 'WhatsApp, Telegram, Webhook',
				icon: Boxes,
			},
		],
	},
];

const CONTENT_MAP: Record<string, ReactNode> = {
	users: <UsersTab />,
	roles: <RolesTab />,
	modules: <ModulesTab />,
	notifications: <NotificationsTab />,
	integrations: <IntegrationsTab />,
};

export default function ConfigurationPage() {
	const cookies = useCookies();
	const [activeTab, setActiveTab] = useState<string>('users');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTab = cookies.get(COOKIE_KEY);
		if (savedTab && CONTENT_MAP[savedTab]) {
			setActiveTab(savedTab);
		}
	}, [cookies]);

	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId);
		cookies.set(COOKIE_KEY, tabId, { path: '/', sameSite: 'Lax' });
	};

	return (
		<AppLayout title='Configuration'>
			<div className='flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]'>
				{/* Left Sidebar Navigation */}
				<aside className='w-full lg:w-72 shrink-0 space-y-5 bg-white dark:bg-[#121c2f] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs h-fit'>
					<nav className='space-y-5'>
						{MENU_GROUPS.map((group, gIdx) => (
							<div key={gIdx} className='space-y-1.5'>
								<h2 className='px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>
									{group.label}
								</h2>

								<div className='space-y-1'>
									{group.items.map((item) => {
										const Icon = item.icon;
										const isActive = activeTab === item.id;

										return (
											<button
												key={item.id}
												type='button'
												onClick={() => handleTabChange(item.id)}
												className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group cursor-pointer ${
													isActive
														? 'bg-[#0073ea]/10 dark:bg-[#0073ea]/20 text-[#0073ea] dark:text-[#3894ff] border border-[#0073ea]/30 shadow-xs ring-1 ring-[#0073ea]/20'
														: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
												}`}
											>
												<div className='flex items-center gap-3 min-w-0'>
													<div
														className={`p-2 rounded-lg transition-colors ${
															isActive
																? 'bg-[#0073ea] text-white shadow-xs shadow-blue-500/20'
																: 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
														}`}
													>
														<Icon className='w-4 h-4 shrink-0' />
													</div>
													<div className='min-w-0'>
														<div className='text-xs font-bold truncate leading-tight'>
															{item.label}
														</div>
														<div className='text-[10px] text-slate-400 truncate mt-0.5'>
															{item.description}
														</div>
													</div>
												</div>

												{isActive && (
													<ChevronRight className='w-3.5 h-3.5 text-[#0073ea] dark:text-[#3894ff] shrink-0' />
												)}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</nav>
				</aside>

				{/* Right Content Area */}
				<main className='flex-1 min-w-0'>
					{CONTENT_MAP[activeTab] || CONTENT_MAP.users}
				</main>
			</div>
		</AppLayout>
	);
}
