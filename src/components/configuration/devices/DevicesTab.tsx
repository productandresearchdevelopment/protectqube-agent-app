'use client';

import React, { useState } from 'react';
import {
	Search,
	MoreVertical,
	Cpu,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { IConfigDevice, useConfigDevices, useClients } from '@/store/api/system';
import { DeviceEditModal } from './DeviceEditModal';

export const DevicesTab: React.FC = () => {
	const [search, setSearch] = useState('');
	const [selectedClient, setSelectedClient] = useState<string>('all');
	const [selectedStatus, setSelectedStatus] = useState<string>('all');
	const [page, setPage] = useState(1);
	const pageSize = 20;

	const [editingDevice, setEditingDevice] = useState<IConfigDevice | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { data: clientsResponse } = useClients({ all: true });
	const clientsList = clientsResponse?.data || [];

	const { data: response, isLoading } = useConfigDevices({
		search: search.trim() || undefined,
		client_id: selectedClient === 'all' ? undefined : selectedClient,
		is_active: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
		page,
		page_size: pageSize,
	});

	const devices = response?.data || [];
	const total = response?.total || 0;
	const totalPages = Math.ceil(total / pageSize) || 1;

	const handleOpenEdit = (device: IConfigDevice) => {
		setEditingDevice(device);
		setIsModalOpen(true);
	};

	const formatOpHours = (start?: string | null, end?: string | null) => {
		if (!start && !end) return '24 Hours (Full)';
		const s = start ? start.substring(0, 5) : '00:00';
		const e = end ? end.substring(0, 5) : '23:59';
		return `${s} - ${e}`;
	};

	return (
		<div className="space-y-6 font-sans">
			{/* Top Bar Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
						Device
					</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
						Configure IoT edge gateway properties, locations, and DVR camera channels
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					{/* Search */}
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
						<input
							type="text"
							placeholder="Search gateway ID, location..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070e1c] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all shadow-xs"
						/>
					</div>

					{/* Client Filter */}
					<div className="relative">
						<select
							value={selectedClient}
							onChange={(e) => {
								setSelectedClient(e.target.value);
								setPage(1);
							}}
							className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070e1c] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all cursor-pointer shadow-xs"
						>
							<option value="all">All Clients</option>
							{clientsList.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} {c.code ? `(${c.code})` : ''}
								</option>
							))}
						</select>
					</div>

					{/* Status Filter */}
					<div className="relative">
						<select
							value={selectedStatus}
							onChange={(e) => {
								setSelectedStatus(e.target.value);
								setPage(1);
							}}
							className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070e1c] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all cursor-pointer shadow-xs"
						>
							<option value="all">All Status</option>
							<option value="active">Active Only</option>
							<option value="inactive">Inactive Only</option>
						</select>
					</div>
				</div>
			</div>

			{/* Devices Table */}
			<div className="bg-white dark:bg-[#070e1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-slate-50/75 dark:bg-slate-900/75 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
							<tr>
								<th className="px-5 py-3.5">Location</th>
								<th className="px-5 py-3.5">Gateway ID</th>
								<th className="px-5 py-3.5">Client</th>
								<th className="px-5 py-3.5">Hardware Model</th>
								<th className="px-5 py-3.5">Cameras</th>
								<th className="px-5 py-3.5">Operational Hours</th>
								<th className="px-5 py-3.5 text-center">Status</th>
								<th className="px-5 py-3.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
							{isLoading ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-slate-400">
										<Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#0073ea]" />
										<span>Loading devices...</span>
									</td>
								</tr>
							) : devices.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-5 py-12 text-center text-slate-400">
										<Cpu className="size-8 mx-auto mb-2 opacity-30" />
										<span>No devices found matching your filter criteria</span>
									</td>
								</tr>
							) : (
								devices.map((device) => {
									const selCams = device.selected_cameras || device.property?.selected_cameras;
									const camCount = (selCams && Array.isArray(selCams))
										? selCams.length
										: (device.total_cameras ?? device.property?.total_cameras ?? 0);

									return (
										<tr
											key={device.id}
											className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
										>
											{/* Location */}
											<td className="px-5 py-3.5 text-slate-900 dark:text-white text-xs font-medium">
												{device.location || '-'}
											</td>

											{/* Gateway ID */}
											<td className="px-5 py-3.5 font-bold font-mono text-slate-900 dark:text-white text-[13px]">
												{device.name}
											</td>

											{/* Client */}
											<td className="px-5 py-3.5">
												{device.client_name ? (
													<span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-[#0073ea] dark:text-[#3894ff] border border-blue-500/20">
														{device.client_name}
													</span>
												) : (
													<span className="text-slate-400 dark:text-slate-500 text-xs">
														-
													</span>
												)}
											</td>

											{/* Hardware Model */}
											<td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs">
												{device.hardware_model || '-'}
											</td>

											{/* Cameras */}
											<td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300">
												<span className="font-semibold">{camCount} Cam{camCount !== 1 ? 's' : ''}</span>
												{selCams && Array.isArray(selCams) && selCams.length > 0 && (
													<span className="ml-1 text-[11px] text-slate-400">
														(Ch {selCams.join(', ')})
													</span>
												)}
											</td>

											{/* Operational Hours */}
											<td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs">
												{formatOpHours(device.operational_start, device.operational_end)}
											</td>

											{/* Active / Inactive Status */}
											<td className="px-5 py-3.5 text-center">
												<span
													className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
														device.is_active
															? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/25'
															: 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700'
													}`}
												>
													<span
														className={`size-1.5 rounded-full ${
															device.is_active ? 'bg-emerald-500' : 'bg-slate-400'
														}`}
													/>
													<span>{device.is_active ? 'Active' : 'Inactive'}</span>
												</span>
											</td>

											{/* Actions */}
											<td className="px-5 py-3.5 text-right">
												<button
													onClick={() => handleOpenEdit(device)}
													title="Edit Device"
													className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
												>
													<MoreVertical className="size-4" />
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination & Counter Bar */}
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
					<div className="text-xs text-slate-500 dark:text-slate-400">
						Showing <span className="font-bold text-slate-900 dark:text-white">{devices.length}</span> of{' '}
						<span className="font-bold text-slate-900 dark:text-white">{total}</span> devices
					</div>

					{totalPages > 1 && (
						<div className="flex items-center gap-3">
							<span className="text-xs text-slate-500 dark:text-slate-400">
								Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{' '}
								<span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
							</span>
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
									className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
								>
									<ChevronLeft className="size-4" />
								</button>
								<button
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
									className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
								>
									<ChevronRight className="size-4" />
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Edit Device Modal */}
			<DeviceEditModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingDevice(null);
				}}
				device={editingDevice}
			/>
		</div>
	);
};
