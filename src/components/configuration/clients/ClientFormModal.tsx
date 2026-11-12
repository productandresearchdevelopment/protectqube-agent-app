'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Loader2 } from 'lucide-react';
import { IClient, useCreateClient, useUpdateClient } from '@/store/api/system';
import { toast } from 'sonner';

interface ClientFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	client?: IClient | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, client }) => {
	const isEdit = Boolean(client?.id);
	const createClientMutation = useCreateClient();
	const updateClientMutation = useUpdateClient();

	const [formData, setFormData] = useState({
		name: '',
		code: '',
	});

	useEffect(() => {
		if (isOpen) {
			if (client) {
				setFormData({
					name: client.name || '',
					code: client.code || '',
				});
			} else {
				setFormData({
					name: '',
					code: '',
				});
			}
		}
	}, [isOpen, client]);

	if (!isOpen) return null;

	const isPending = createClientMutation.isPending || updateClientMutation.isPending;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error('Client name is required');
			return;
		}

		try {
			if (isEdit && client?.id) {
				await updateClientMutation.mutateAsync({
					id: client.id,
					payload: {
						name: formData.name.trim(),
						code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
						is_active: true,
					},
				});
				toast.success(`Client '${formData.name}' updated successfully`);
			} else {
				await createClientMutation.mutateAsync({
					name: formData.name.trim(),
					code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
					is_active: true,
				});
				toast.success(`Client '${formData.name}' created successfully`);
			}
			onClose();
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Operation failed');
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div
				className="w-full max-w-lg bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0a1224]">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-xl bg-[#0073ea]/10 border border-[#0073ea]/20 flex items-center justify-center text-[#0073ea]">
							<Building2 className="size-5" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-900 dark:text-white">
								{isEdit ? 'Edit Client' : 'Add New Client'}
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{isEdit ? 'Update corporate / client details' : 'Register a new enterprise client owner'}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isPending}
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Modal Body */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
							Client / Company Name <span className="text-rose-500">*</span>
						</label>
						<input
							type="text"
							required
							placeholder="e.g. PT Bank Central Asia, Alfamart, Indomaret"
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
							Client Code / Alias (Optional)
						</label>
						<input
							type="text"
							placeholder="e.g. BCA, ALFA, INDO"
							value={formData.code}
							onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
							className="w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all"
						/>
						<p className="text-[11px] text-slate-400">Unique corporate code for quick device filtering and report tagging.</p>
					</div>

					{/* Modal Actions */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
						<button
							type="button"
							onClick={onClose}
							disabled={isPending}
							className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0073ea] hover:bg-[#0060c0] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
						>
							{isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
							<span>{isEdit ? 'Save Changes' : 'Create Client'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
