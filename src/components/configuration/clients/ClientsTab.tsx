'use client';

import React, { useState } from 'react';
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	Building2,
	HardDrive,
	Loader2,
} from 'lucide-react';
import { IClient, useClients, useDeleteClient } from '@/store/api/system';
import { ClientFormModal } from './ClientFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export const ClientsTab: React.FC = () => {
	const [search, setSearch] = useState('');
	const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; client: IClient | null }>({
		isOpen: false,
		client: null,
	});

	const { data: response, isLoading } = useClients({
		search: search.trim() || undefined,
	});

	const clients = response?.data || [];
	const deleteMutation = useDeleteClient();

	const handleOpenCreate = () => {
		setSelectedClient(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (client: IClient) => {
		setSelectedClient(client);
		setIsModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteDialog.client?.id) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.client.id);
			toast.success(`Client '${deleteDialog.client.name}' deleted successfully`);
			setDeleteDialog({ isOpen: false, client: null });
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Failed to delete client');
		}
	};

	return (
		<div className="space-y-6 font-sans">
			{/* Top Bar Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
						Clients
					</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
						Manage corporate accounts, client profiles, and fleet assignments
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					{/* Search */}
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
						<input
							type="text"
							placeholder="Search client name or code..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070e1c] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/20 focus:border-[#0073ea] transition-all shadow-xs"
						/>
					</div>

					{/* Create Button */}
					<button
						onClick={handleOpenCreate}
						className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0073ea] hover:bg-[#0060c0] rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
					>
						<Plus className="size-4" />
						<span>Add Client</span>
					</button>
				</div>
			</div>

			{/* Clients Table */}
			<div className="bg-white dark:bg-[#070e1c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-slate-50 dark:bg-[#0a1224] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
							<tr>
								<th className="py-3 px-4">Clients</th>
								<th className="py-3 px-4">Code</th>
								<th className="py-3 px-4 text-center">Linked Devices</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
							{isLoading ? (
								<tr>
									<td colSpan={4} className="py-12 text-center text-slate-400">
										<div className="flex flex-col items-center justify-center gap-2">
											<Loader2 className="size-6 animate-spin text-[#0073ea]" />
											<span>Loading client accounts...</span>
										</div>
									</td>
								</tr>
							) : clients.length === 0 ? (
								<tr>
									<td colSpan={4} className="py-12 text-center text-slate-400">
										<div className="flex flex-col items-center justify-center gap-2">
											<Building2 className="size-8 text-slate-300 dark:text-slate-600" />
											<p className="font-semibold text-slate-600 dark:text-slate-400">No clients registered</p>
											<p className="text-[11px] text-slate-400">Click &quot;Add Client&quot; above to create your first client company.</p>
										</div>
									</td>
								</tr>
							) : (
								clients.map((c) => (
									<tr
										key={c.id}
										className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
									>
										{/* Client Name */}
										<td className="py-3.5 px-4">
											<div className="flex items-center gap-3">
												<div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#0073ea] shrink-0 font-bold">
													{c.code ? c.code.slice(0, 2) : c.name.slice(0, 2).toUpperCase()}
												</div>
												<div className="font-bold text-slate-900 dark:text-white truncate">
													{c.name}
												</div>
											</div>
										</td>

										{/* Code */}
										<td className="py-3.5 px-4">
											{c.code ? (
												<span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
													{c.code}
												</span>
											) : (
												<span className="text-slate-400">-</span>
											)}
										</td>

										{/* Linked Devices */}
										<td className="py-3.5 px-4 text-center">
											<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
												<HardDrive className="size-3.5" />
												<span>{c.devices_count ?? 0} Gateway</span>
											</span>
										</td>

										{/* Actions */}
										<td className="py-3.5 px-4 text-right">
											<div className="flex items-center justify-end gap-1">
												<button
													onClick={() => handleOpenEdit(c)}
													title="Edit Client"
													className="p-1.5 rounded-lg text-slate-400 hover:text-[#0073ea] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
												>
													<Pencil className="size-4" />
												</button>
												<button
													onClick={() => setDeleteDialog({ isOpen: true, client: c })}
													title="Delete Client"
													className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
												>
													<Trash2 className="size-4" />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Footer Counter */}
				<div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
					<div className="text-xs text-slate-500 dark:text-slate-400">
						Total <span className="font-bold text-slate-900 dark:text-white">{clients.length}</span> clients
					</div>
				</div>
			</div>

			{/* Form Modal */}
			<ClientFormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				client={selectedClient}
			/>

			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				isOpen={deleteDialog.isOpen}
				onClose={() => setDeleteDialog({ isOpen: false, client: null })}
				onConfirm={handleConfirmDelete}
				title="Delete Client"
				description={`Are you sure you want to delete '${deleteDialog.client?.name}'? Any devices assigned to this client will be unassigned (client_id set to null).`}
				confirmLabel="Yes, Delete Client"
				variant="danger"
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
};
