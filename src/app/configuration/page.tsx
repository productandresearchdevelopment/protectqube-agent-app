'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
	Users as UsersIcon,
	ShieldCheck,
	Layers,
	Bell,
	Boxes,
	Building2,
	Cpu,
} from 'lucide-react';
import { useCookies } from '@/hooks/useCookies';
import { UsersTab } from '@/components/configuration/users/UsersTab';
import { RolesTab } from '@/components/configuration/roles/RolesTab';
import { ModulesTab } from '@/components/configuration/modules/ModulesTab';
import { NotificationsTab } from '@/components/configuration/notifications/NotificationsTab';
import { IntegrationsTab } from '@/components/configuration/integrations/IntegrationsTab';
import { ClientsTab } from '@/components/configuration/clients/ClientsTab';
import { DevicesTab } from '@/components/configuration/devices/DevicesTab';

const COOKIE_KEY = 'system_config_tab';

interface ConfigMenuItem {
	id: string;
	label: string;
	icon: React.ElementType;
}

interface ConfigMenuGroup {
	label: string;
	items: ConfigMenuItem[];
}

const MENU_GROUPS: ConfigMenuGroup[] = [
	{
		label: 'Master Data',
		items: [
			{
				id: 'users',
				label: 'Users',
				icon: UsersIcon,
			},
			{
				id: 'clients',
				label: 'Clients',
				icon: Building2,
			},
			{
				id: 'devices',
				label: 'Device',
				icon: Cpu,
			},
		],
	},
	{
		label: 'Access Control',
		items: [
			{
				id: 'roles',
				label: 'Roles & Permissions',
				icon: ShieldCheck,
			},
			{
				id: 'modules',
				label: 'Modules',
				icon: Layers,
			},
		],
	},
	{
		label: 'Alerts & Notifications',
		items: [
			{
				id: 'notifications',
				label: 'Notifications',
				icon: Bell,
			},
			{
				id: 'integrations',
				label: 'Integrations',
				icon: Boxes,
			},
		],
	},
];

const CONTENT_MAP: Record<string, ReactNode> = {
	clients: <ClientsTab />,
	devices: <DevicesTab />,
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
				<aside className='w-full lg:w-64 shrink-0 space-y-4 bg-white dark:bg-[#121c2f] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs h-fit'>
					<nav className='space-y-4'>
						{MENU_GROUPS.map((group, gIdx) => (
							<div key={gIdx} className='space-y-1'>
								<h2 className='px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500'>
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
												className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
													isActive
														? 'bg-[#0073ea] text-white shadow-md shadow-blue-500/25 font-semibold'
														: 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
												}`}
											>
												<Icon className='size-5 shrink-0' />
												<span className='truncate'>{item.label}</span>
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
