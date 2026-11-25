'use client';

import React, { useState, useMemo } from 'react';
import {
	Search,
	MoreVertical,
	ChevronDown,
	Download,
	Loader2,
	Building2,
	Filter,
	X,
	Calendar,
} from 'lucide-react';
import {
	IConfigDevice,
	useConfigDevices,
	useClients,
	exportDevicesRawMqtt,
} from '@/store/api/system';
import { DataTable, ColumnDef, IPaginationData } from '@/components/ui';
import { DeviceEditModal } from './DeviceEditModal';
import { useAuthUser } from '@/hooks/useAuthUser';
import { toast } from 'sonner';

type ExportRangePreset = 'today' | '7d' | '30d' | 'custom' | 'all';

const getWibDateString = (offsetDays = 0): string => {
	const now = new Date();
	const wibMs = now.getTime() + 7 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000;
	const d = new Date(wibMs);
	const yyyy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(d.getUTCDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
};

export const DevicesTab: React.FC = () => {
	const { hasModule } = useAuthUser();
	const canExportRawMqtt =
		hasModule('/api/v1/devices/export-raw-mqtt') || hasModule('Device Export Raw MQTT');

	const [search, setSearch] = useState('');
	const [selectedClient, setSelectedClient] = useState<string>('all');
	const [selectedStatus, setSelectedStatus] = useState<string>('all');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
	const [isExporting, setIsExporting] = useState(false);
	const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
	const [exportPreset, setExportPreset] = useState<ExportRangePreset>('7d');
	const [customStartDate, setCustomStartDate] = useState<string>(() => getWibDateString(-6));
	const [customEndDate, setCustomEndDate] = useState<string>(() => getWibDateString(0));

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
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	const paginationData: IPaginationData = useMemo(() => {
		const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
		const end = Math.min(page * pageSize, total);
		return {
			total_items: total,
			total_pages: totalPages,
			current_page: page,
			page_size: pageSize,
			showing_start: start,
			showing_end: end,
		};
	}, [total, totalPages, page, pageSize]);

	const pageDeviceIds = useMemo(() => devices.map((d) => d.id), [devices]);

	const allPageSelected = useMemo(() => {
		return devices.length > 0 && devices.every((d) => selectedDeviceIds.includes(d.id));
	}, [devices, selectedDeviceIds]);

	const handleToggleSelectAll = () => {
		if (allPageSelected) {
			setSelectedDeviceIds((prev) => prev.filter((id) => !pageDeviceIds.includes(id)));
		} else {
			setSelectedDeviceIds((prev) => Array.from(new Set([...prev, ...pageDeviceIds])));
		}
	};

	const handleToggleSelectOne = (id: string) => {
		setSelectedDeviceIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const resolvedDateRange = useMemo(() => {
		const today = getWibDateString(0);
		if (exportPreset === 'today') return { start_date: today, end_date: today };
		if (exportPreset === '7d') return { start_date: getWibDateString(-6), end_date: today };
		if (exportPreset === '30d') return { start_date: getWibDateString(-29), end_date: today };
		if (exportPreset === 'custom') {
			return {
				start_date: customStartDate || undefined,
				end_date: customEndDate || undefined,
			};
		}
		return { start_date: undefined, end_date: undefined };
	}, [exportPreset, customStartDate, customEndDate]);

	const isCustomRangeInvalid =
		exportPreset === 'custom' &&
		Boolean(customStartDate && customEndDate && customStartDate > customEndDate);

	const handleExportRawMqtt = async () => {
		if (isExporting || total === 0 || isCustomRangeInvalid) return;
		try {
			setIsExporting(true);
			setIsExportPopoverOpen(false);
			const res = await exportDevicesRawMqtt(
				selectedDeviceIds.length > 0
					? {
							device_ids: selectedDeviceIds,
							start_date: resolvedDateRange.start_date,
							end_date: resolvedDateRange.end_date,
					  }
					: {
							search: search.trim() || undefined,
							client_id: selectedClient === 'all' ? undefined : selectedClient,
							is_active: selectedStatus === 'all' ? undefined : selectedStatus,
							start_date: resolvedDateRange.start_date,
							end_date: resolvedDateRange.end_date,
					  }
			);
			toast.success(`Export berhasil: ${res.filename}`);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Gagal export data Raw MQTT');
		} finally {
			setIsExporting(false);
		}
	};

	const handleOpenEdit = (device: IConfigDevice) => {
		setEditingDevice(device);
		setIsModalOpen(true);
	};

	const selectedCount = selectedDeviceIds.length;
	const exportLabel = isExporting
		? 'Exporting...'
		: selectedCount === 1
			? 'Export JSON (1)'
			: selectedCount > 1
				? `Export ZIP (${selectedCount})`
				: total === 1
					? 'Export JSON (1)'
					: 'Export All (ZIP)';

	const columns: ColumnDef<IConfigDevice>[] = useMemo(
		() => [
			{
				id: 'location',
				header: 'Location',
				accessorKey: 'location',
				className: 'min-w-[220px] max-w-[320px]',
				cell: (device) => (
					<span
						className="font-semibold text-slate-900 dark:text-white truncate block max-w-[300px]"
						title={device.location || '-'}
					>
						{device.location || '-'}
					</span>
				),
			},
			{
				id: 'name',
				header: 'Gateway ID',
				accessorKey: 'name',
				className: 'whitespace-nowrap',
				cell: (device) => (
					<span className="font-bold font-mono text-slate-900 dark:text-white text-xs whitespace-nowrap">
						{device.name}
					</span>
				),
			},
			{
				id: 'client_name',
				header: 'Client',
				align: 'center',
				className: 'whitespace-nowrap',
				cell: (device) =>
					device.client_name ? (
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-[#0073ea] dark:text-[#3894ff] border border-blue-500/20 whitespace-nowrap">
							{device.client_name}
						</span>
					) : (
						<span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
					),
			},
			{
				id: 'cameras',
				header: 'Cameras',
				align: 'center',
				className: 'whitespace-nowrap',
				cell: (device) => {
					const selCams = device.selected_cameras || device.property?.selected_cameras;
					const camCount =
						selCams && Array.isArray(selCams)
							? selCams.length
							: (device.total_cameras ?? device.property?.total_cameras ?? 0);
					return (
						<span className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
							<span className="font-semibold">
								{camCount} Cam{camCount !== 1 ? 's' : ''}
							</span>
							{selCams && Array.isArray(selCams) && selCams.length > 0 && (
								<span className="ml-1 text-[11px] text-slate-400">
									(Ch {selCams.join(', ')})
								</span>
							)}
						</span>
					);
				},
			},
			{
				id: 'status',
				header: 'Status',
				align: 'center',
				className: 'whitespace-nowrap',
				cell: (device) => (
					<span
						className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
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
				),
			},
			{
				id: 'actions',
				header: 'Actions',
				align: 'right',
				className: 'w-16 whitespace-nowrap',
				cell: (device) => (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleOpenEdit(device);
						}}
						title="Edit Device"
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
					>
						<MoreVertical className="size-4" />
					</button>
				),
			},
		],
		[]
	);

	return (
		<div className="space-y-4 font-sans">
			{/* Row 1: Title & Subtitle (Left) + Search Input Only (Right) */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
						Devices
					</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
						Configure gateways, cameras &amp; bulk Raw MQTT export
					</p>
				</div>

				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
					<input
						type="text"
						placeholder="Search Gateway ID or Location..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full pl-8 pr-7 py-2 text-xs bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all"
					/>
					{search && (
						<button
							type="button"
							onClick={() => {
								setSearch('');
								setPage(1);
							}}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
						>
							<X className="size-3" />
						</button>
					)}
				</div>
			</div>

			{/* Row 2: Export Button with Date Range Popover (Left) + All Filters (Right) */}
			<div className="flex flex-wrap items-center justify-between gap-2.5">
				<div className="relative flex items-center gap-2">
					{canExportRawMqtt && (
						<>
							<button
								type="button"
								disabled={isExporting || total === 0}
								onClick={() => setIsExportPopoverOpen((prev) => !prev)}
								className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
									isExporting
										? 'bg-[#0073ea]/80 cursor-wait'
										: 'bg-[#0073ea] hover:bg-blue-600 active:scale-95'
								}`}
								title="Pilih rentang tanggal lalu export Raw MQTT"
							>
								{isExporting ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : (
									<Download className="size-3.5" />
								)}
								<span>{exportLabel}</span>
								{!isExporting && (
									<ChevronDown
										className={`size-3.5 opacity-80 transition-transform ${
											isExportPopoverOpen ? 'rotate-180' : ''
										}`}
									/>
								)}
							</button>

							{isExportPopoverOpen && (
								<>
									<div
										className="fixed inset-0 z-40"
										onClick={() => setIsExportPopoverOpen(false)}
									/>
									<div className="absolute left-0 top-full mt-2 w-80 z-50 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-4 space-y-3.5">
										<div className="flex items-start justify-between gap-2">
											<div>
												<div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
													<Calendar className="size-3.5 text-[#0073ea] dark:text-[#3894ff]" />
													<span>Export Raw MQTT Range</span>
												</div>
												<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
													{selectedCount === 1
														? '1 device selected (.json)'
														: selectedCount > 1
															? `${selectedCount} devices selected (.zip)`
															: total === 1
																? '1 filtered device (.json)'
																: `All ${total} filtered devices (.zip)`}
												</p>
											</div>
											<button
												type="button"
												onClick={() => setIsExportPopoverOpen(false)}
												className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
											>
												<X className="size-3.5" />
											</button>
										</div>

										{/* Quick Range Presets */}
										<div className="grid grid-cols-3 gap-1.5">
											{(
												[
													{ id: 'today', label: 'Today' },
													{ id: '7d', label: 'Last 7 Days' },
													{ id: '30d', label: 'Last 30 Days' },
													{ id: 'custom', label: 'Custom' },
													{ id: 'all', label: 'All Time' },
												] as { id: ExportRangePreset; label: string }[]
											).map((preset) => {
												const active = exportPreset === preset.id;
												return (
													<button
														key={preset.id}
														type="button"
														onClick={() => setExportPreset(preset.id)}
														className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
															active
																? 'bg-[#0073ea] text-white border-[#0073ea] shadow-xs'
																: 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-[#0073ea]/50'
														}`}
													>
														{preset.label}
													</button>
												);
											})}
										</div>

										{/* Date Range Inputs / Preview */}
										{exportPreset === 'custom' ? (
											<div className="grid grid-cols-2 gap-2 pt-0.5">
												<div>
													<label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
														Start Date (WIB)
													</label>
													<input
														type="date"
														value={customStartDate}
														max={customEndDate || undefined}
														onChange={(e) => setCustomStartDate(e.target.value)}
														className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea]"
													/>
												</div>
												<div>
													<label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
														End Date (WIB)
													</label>
													<input
														type="date"
														value={customEndDate}
														min={customStartDate || undefined}
														onChange={(e) => setCustomEndDate(e.target.value)}
														className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea]"
													/>
												</div>
												{isCustomRangeInvalid && (
													<p className="col-span-2 text-[11px] text-rose-500 font-medium">
														Start Date tidak boleh lebih besar dari End Date.
													</p>
												)}
											</div>
										) : exportPreset === 'all' ? (
											<div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
												Semua riwayat telemetry dari awal sampai sekarang (ukuran file bisa lebih besar).
											</div>
										) : (
											<div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
												<span className="text-slate-500 dark:text-slate-400">Range (WIB)</span>
												<span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
													{resolvedDateRange.start_date} → {resolvedDateRange.end_date}
												</span>
											</div>
										)}

										{/* Footer Actions */}
										<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
											<button
												type="button"
												onClick={() => setIsExportPopoverOpen(false)}
												className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
											>
												Cancel
											</button>
											<button
												type="button"
												disabled={isExporting || isCustomRangeInvalid}
												onClick={handleExportRawMqtt}
												className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0073ea] hover:bg-blue-600 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Download className="size-3.5" />
												<span>
													{selectedCount === 1 || (selectedCount === 0 && total === 1)
														? 'Download JSON'
														: 'Download ZIP'}
												</span>
											</button>
										</div>
									</div>
								</>
							)}
						</>
					)}
					{selectedCount > 0 && (
						<button
							type="button"
							onClick={() => setSelectedDeviceIds([])}
							className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
						>
							Clear ({selectedCount})
						</button>
					)}
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					{/* Client Filter */}
					<div className="relative">
						<Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
						<select
							value={selectedClient}
							onChange={(e) => {
								setSelectedClient(e.target.value);
								setPage(1);
								setSelectedDeviceIds([]);
							}}
							className="appearance-none pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all cursor-pointer shadow-xs"
						>
							<option value="all" className="bg-white dark:bg-slate-900">
								All Clients
							</option>
							{clientsList.map((c) => (
								<option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
									{c.name} {c.code ? `(${c.code})` : ''}
								</option>
							))}
						</select>
						<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
					</div>

					{/* Status Filter */}
					<div className="relative">
						<Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
						<select
							value={selectedStatus}
							onChange={(e) => {
								setSelectedStatus(e.target.value);
								setPage(1);
								setSelectedDeviceIds([]);
							}}
							className="appearance-none pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea] transition-all cursor-pointer shadow-xs"
						>
							<option value="all" className="bg-white dark:bg-slate-900">
								All Status
							</option>
							<option value="active" className="bg-white dark:bg-slate-900">
								Active Only
							</option>
							<option value="inactive" className="bg-white dark:bg-slate-900">
								Inactive Only
							</option>
						</select>
						<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
					</div>
				</div>
			</div>

			{/* Unified DataTable (identical to Cellular table & pagination) */}
			<DataTable<IConfigDevice>
				data={devices}
				columns={columns}
				keyField="id"
				isLoading={isLoading}
				emptyMessage="No devices found matching your filter criteria"
				enableSelection={true}
				selectedIds={selectedDeviceIds}
				onToggleSelectAll={handleToggleSelectAll}
				onToggleSelectOne={handleToggleSelectOne}
				pagination={paginationData}
				currentPage={page}
				pageSize={pageSize}
				onPageChange={(p) => setPage(p)}
				onPageSizeChange={(size) => {
					setPageSize(size);
					setPage(1);
				}}
				pageSizeOptions={[10, 20, 50, 100, 500, 1000]}
			/>

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
