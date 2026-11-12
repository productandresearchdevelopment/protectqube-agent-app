'use client';

import React, { useState, useEffect } from 'react';
import {
	X,
	Cpu,
	Save,
	Loader2,
	Video,
	Clock,
	MapPin,
	Building2,
	CheckSquare,
	Square,
	CheckCircle2,
	AlertCircle,
} from 'lucide-react';
import {
	IConfigDevice,
	useClients,
	useUpdateConfigDevice,
	useConfigDevice,
	IDetectedCamera,
} from '@/store/api/system';
import { toast } from 'sonner';

interface DeviceEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	device: IConfigDevice | null;
}

export const DeviceEditModal: React.FC<DeviceEditModalProps> = ({ isOpen, onClose, device }) => {
	const updateDeviceMutation = useUpdateConfigDevice();
	const { data: clientResponse, isLoading: loadingClients } = useClients({ all: true });
	const clientList = clientResponse?.data || [];

	// Fetch fresh device detail to get detected MQTT cameras
	const { data: deviceDetailResponse, isLoading: loadingDetail } = useConfigDevice(isOpen ? device?.id : null);
	const freshDevice = deviceDetailResponse?.data || device;
	const detectedCameras: IDetectedCamera[] = freshDevice?.detected_cameras || [];

	const [formData, setFormData] = useState({
		client_id: '',
		location: '',
		hardware_model: '',
		operational_start: '',
		operational_end: '',
		total_cameras: 0,
		selected_cameras: [] as string[],
		is_active: true,
	});

	useEffect(() => {
		if (isOpen && freshDevice) {
			const prop = freshDevice.property || {};
			const savedSelected = freshDevice.selected_cameras || prop.selected_cameras;
			const initialTotal = freshDevice.total_cameras ?? prop.total_cameras ?? 0;

			let initialSelected: string[] = [];
			if (Array.isArray(savedSelected) && savedSelected.length > 0) {
				initialSelected = savedSelected.map(String);
			} else if (detectedCameras.length > 0) {
				const onlineOnly = detectedCameras.filter((c) => c.is_online).map((c) => String(c.id));
				initialSelected = onlineOnly.length > 0 ? onlineOnly : detectedCameras.map((c) => String(c.id));
			}

			setFormData({
				client_id: freshDevice.client_id || '',
				location: freshDevice.location || '',
				hardware_model: freshDevice.hardware_model || '',
				operational_start: freshDevice.operational_start ? freshDevice.operational_start.substring(0, 5) : '',
				operational_end: freshDevice.operational_end ? freshDevice.operational_end.substring(0, 5) : '',
				total_cameras: initialSelected.length > 0 ? initialSelected.length : Number(initialTotal) || 0,
				selected_cameras: initialSelected,
				is_active: freshDevice.is_active ?? true,
			});
		}
	}, [isOpen, freshDevice?.id, detectedCameras.length]);

	if (!isOpen || !device) return null;

	const isPending = updateDeviceMutation.isPending;

	const toggleCamera = (camId: string) => {
		setFormData((prev) => {
			const idStr = String(camId);
			const exists = prev.selected_cameras.includes(idStr);
			const updated = exists
				? prev.selected_cameras.filter((id) => id !== idStr)
				: [...prev.selected_cameras, idStr];
			return {
				...prev,
				selected_cameras: updated,
				total_cameras: updated.length,
			};
		});
	};

	const selectAllCameras = () => {
		const allIds = detectedCameras.map((c) => String(c.id));
		setFormData((prev) => ({
			...prev,
			selected_cameras: allIds,
			total_cameras: allIds.length,
		}));
	};

	const clearAllCameras = () => {
		setFormData((prev) => ({
			...prev,
			selected_cameras: [],
			total_cameras: 0,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await updateDeviceMutation.mutateAsync({
				id: device.id,
				payload: {
					client_id: formData.client_id.trim() ? formData.client_id.trim() : null,
					location: formData.location.trim(),
					hardware_model: formData.hardware_model.trim() || undefined,
					operational_start: formData.operational_start.trim() ? formData.operational_start.trim() : null,
					operational_end: formData.operational_end.trim() ? formData.operational_end.trim() : null,
					selected_cameras: formData.selected_cameras,
					total_cameras: formData.selected_cameras.length > 0 ? formData.selected_cameras.length : formData.total_cameras,
					is_active: formData.is_active,
				},
			});

			toast.success(`Device '${device.name}' updated successfully`);
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to update device');
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div
				className="w-full max-w-2xl lg:max-w-3xl bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0a1224] shrink-0">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-xl bg-[#0073ea]/10 border border-[#0073ea]/20 flex items-center justify-center text-[#0073ea]">
							<Cpu className="size-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base font-bold text-slate-900 dark:text-white">
									Edit Device
								</h3>
								<span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#0073ea]/10 text-[#0073ea] dark:text-[#3894ff] font-semibold border border-[#0073ea]/20">
									{device.name}
								</span>
							</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Configure client, camera channels from MQTT, and operational schedule
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isPending}
						className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Modal Body */}
				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
					{/* Device Status: Active / Inactive */}
					<div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
						<div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
									Device Status
								</span>
								<span
									className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
										formData.is_active
											? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/30'
											: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
									}`}
								>
									{formData.is_active ? 'Active' : 'Inactive'}
								</span>
							</div>
							<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
								{formData.is_active
									? 'Device muncul di seluruh halaman monitoring, kalkulasi SLA, dan export.'
									: 'Device dinonaktifkan (disembunyikan dari semua halaman monitoring & export).'}
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={formData.is_active}
							onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
								formData.is_active ? 'bg-[#0073ea]' : 'bg-slate-300 dark:bg-slate-700'
							}`}
						>
							<span
								className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
									formData.is_active ? 'translate-x-5' : 'translate-x-0'
								}`}
							/>
						</button>
					</div>

					{/* Client Selection */}
					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
							<Building2 className="size-3.5 text-[#0073ea]" />
							Client
						</label>
						<select
							value={formData.client_id}
							onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
							disabled={isPending || loadingClients}
							className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all cursor-pointer"
						>
							<option value="">-- No Client Assigned --</option>
							{clientList.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} {c.code ? `(${c.code})` : ''}
								</option>
							))}
						</select>
					</div>

					{/* Location & Hardware Model */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
								<MapPin className="size-3.5 text-emerald-500" />
								Location
							</label>
							<input
								type="text"
								value={formData.location}
								onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								placeholder="e.g. Gedung A Lantai 2"
								disabled={isPending}
								className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
								Hardware Model
							</label>
							<input
								type="text"
								value={formData.hardware_model}
								onChange={(e) => setFormData({ ...formData, hardware_model: e.target.value })}
								placeholder="e.g. Raspberry Pi 4 / Industrial GW"
								disabled={isPending}
								className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all"
							/>
						</div>
					</div>

					{/* Camera DVR Selection */}
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
								<Video className="size-3.5 text-[#0073ea]" />
								Camera DVR
							</label>
							{detectedCameras.length > 0 && (
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={selectAllCameras}
										className="text-[11px] font-medium text-[#0073ea] hover:underline cursor-pointer"
									>
										Pilih Semua ({detectedCameras.length})
									</button>
									<span className="text-slate-300 dark:text-slate-700">•</span>
									<button
										type="button"
										onClick={clearAllCameras}
										className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
									>
										Reset
									</button>
									<span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0073ea]/10 text-[#0073ea] dark:text-[#3894ff] border border-[#0073ea]/20 ml-1">
										{formData.selected_cameras.length} Dipilih
									</span>
								</div>
							)}
						</div>

						{/* Detected Cameras Grid */}
						{loadingDetail ? (
							<div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
								<Loader2 className="size-4 animate-spin text-[#0073ea]" />
								<span>Membaca data kanal kamera dari MQTT telemetri...</span>
							</div>
						) : detectedCameras.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
								{detectedCameras.map((cam) => {
									const isSelected = formData.selected_cameras.includes(String(cam.id));
									return (
										<div
											key={cam.id}
											onClick={() => toggleCamera(cam.id)}
											className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
												isSelected
													? 'bg-[#0073ea]/10 border-[#0073ea]/40 text-[#0073ea] dark:text-[#3894ff] shadow-xs'
													: 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
											}`}
										>
											<div className="flex items-center gap-2.5 min-w-0">
												<div className="shrink-0 text-[#0073ea] dark:text-[#3894ff]">
													{isSelected ? (
														<CheckSquare className="size-4.5" />
													) : (
														<Square className="size-4.5 text-slate-400" />
													)}
												</div>
												<div className="min-w-0">
													<div className="font-bold truncate text-[12px] text-slate-900 dark:text-white">
														Ch {cam.channel}: {cam.name}
													</div>
													<div className="text-[10px] text-slate-400 truncate">
														Resolusi: {cam.resolution || '1080P'}
													</div>
												</div>
											</div>
											<div className="shrink-0 ml-2">
												{cam.is_online ? (
													<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
														<CheckCircle2 className="size-3" />
														Online
													</span>
												) : (
													<span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
														No Video
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						) : (
							/* Fallback if no detected cameras yet */
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
									<AlertCircle className="size-4 shrink-0" />
									<span>Belum ada telemetri NVR yang terdeteksi via MQTT. Anda dapat mengisi total kamera secara manual:</span>
								</div>
								<div className="flex items-center gap-3">
									<input
										type="number"
										min="0"
										max="64"
										value={formData.total_cameras}
										onChange={(e) =>
											setFormData({
												...formData,
												total_cameras: parseInt(e.target.value) || 0,
											})
										}
										className="w-28 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm"
									/>
									<span className="text-xs text-slate-500 dark:text-slate-400">Total kamera terpasang</span>
								</div>
							</div>
						)}
					</div>

					{/* Operational Hours */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
								<Clock className="size-3.5 text-amber-500" />
								Operational Start
							</label>
							<input
								type="time"
								value={formData.operational_start}
								onChange={(e) => setFormData({ ...formData, operational_start: e.target.value })}
								disabled={isPending}
								className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
								<Clock className="size-3.5 text-amber-500" />
								Operational End
							</label>
							<input
								type="time"
								value={formData.operational_end}
								onChange={(e) => setFormData({ ...formData, operational_end: e.target.value })}
								disabled={isPending}
								className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0073ea] transition-all"
							/>
						</div>
					</div>

					{/* Modal Footer */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
						<button
							type="button"
							onClick={onClose}
							disabled={isPending}
							className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0073ea] hover:bg-[#0060c0] shadow-md shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
						>
							{isPending ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="size-4" />
									Save Changes
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
