'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useIntegrations, useConnectIntegration, useDisconnectIntegration } from '@/store/api/integrations';
import { IIntegrationProvider } from '@/types/notifications';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WhatsAppModal } from '@/components/integrations/WhatsAppModal';
import {
	Send,
	MessageSquare,
	Mail,
	Slack,
	ExternalLink,
	Eye,
	EyeOff,
	RotateCw,
	X,
	CheckCircle2,
	Trash2,
	Pencil,
} from 'lucide-react';
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

const PROVIDER_ICONS: Record<string, React.ElementType> = {
	discord: DiscordIcon,
	telegram: Send,
	whatsapp: WhatsAppIcon,
	email: Mail,
	slack: Slack,
};

const PROVIDER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
	discord: {
		bg: 'bg-indigo-50 dark:bg-indigo-950/40',
		text: 'text-indigo-600 dark:text-indigo-400',
		ring: 'border-indigo-200 dark:border-indigo-800',
	},
	telegram: {
		bg: 'bg-sky-50 dark:bg-sky-950/40',
		text: 'text-sky-600 dark:text-sky-400',
		ring: 'border-sky-200 dark:border-sky-800',
	},
	whatsapp: {
		bg: 'bg-emerald-50 dark:bg-emerald-950/40',
		text: 'text-emerald-600 dark:text-emerald-400',
		ring: 'border-emerald-200 dark:border-emerald-800',
	},
	email: {
		bg: 'bg-amber-50 dark:bg-amber-950/40',
		text: 'text-amber-600 dark:text-amber-400',
		ring: 'border-amber-200 dark:border-amber-800',
	},
	slack: {
		bg: 'bg-purple-50 dark:bg-purple-950/40',
		text: 'text-purple-600 dark:text-purple-400',
		ring: 'border-purple-200 dark:border-purple-800',
	},
};

export default function IntegrationsPage() {
	const { data: providers, isLoading } = useIntegrations();
	const connectMutation = useConnectIntegration();
	const disconnectMutation = useDisconnectIntegration();

	const [selectedProvider, setSelectedProvider] = useState<IIntegrationProvider | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
	const [disconnectTarget, setDisconnectTarget] = useState<{ providerKey: string; name: string } | null>(null);
	const [formData, setFormData] = useState<Record<string, string>>({});
	const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

	const handleOpenConfigure = (p: IIntegrationProvider) => {
		setSelectedProvider(p);
		if (p.provider_key === 'whatsapp') {
			setIsWhatsAppModalOpen(true);
			return;
		}
		const initData: Record<string, string> = {};
		p.schema?.fields?.forEach((f) => {
			initData[f.name] = (p.config?.[f.name] as string) || '';
		});
		setFormData(initData);
		setIsModalOpen(true);
	};

	const handleSaveConnect = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedProvider) return;

		try {
			await connectMutation.mutateAsync({
				providerKey: selectedProvider.provider_key,
				config: formData,
			});
			toast.success(`${selectedProvider.display_name} connected successfully!`);
			setIsModalOpen(false);
		} catch (err: any) {
			toast.error(err.message || 'Failed to connect provider');
		}
	};

	const handleConfirmDisconnect = async () => {
		if (!disconnectTarget) return;
		try {
			await disconnectMutation.mutateAsync(disconnectTarget.providerKey);
			toast.success(`${disconnectTarget.name} disconnected.`);
			setDisconnectTarget(null);
		} catch (err: any) {
			toast.error(err.message || 'Failed to disconnect');
		}
	};

	return (
		<AppLayout title='Integration Configuration'>
			<div className='space-y-6'>
				{isLoading ? (
					<div className='py-20 text-center text-slate-400'>
						<RotateCw className='w-8 h-8 mx-auto animate-spin mb-3 text-[#0073ea]' />
						<p className='text-sm font-medium'>Loading integration providers...</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
						{providers?.map((provider) => {
							const IconComp = PROVIDER_ICONS[provider.provider_key] || MessageSquare;
							const isConnected = provider.status === 'CONNECTED';
							const colors = PROVIDER_COLORS[provider.provider_key] || {
								bg: 'bg-slate-50 dark:bg-slate-800',
								text: 'text-slate-700 dark:text-slate-200',
								ring: 'border-slate-200 dark:border-slate-700',
							};

							return (
								<div
									key={provider.provider_key}
									className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between'
								>
									<div>
										<div className='flex items-start justify-between gap-3'>
											<div className='flex items-start gap-3.5 min-w-0'>
												<div
													className={`w-12 h-12 rounded-xl border ${colors.ring} ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
												>
													<IconComp className='w-6 h-6' />
												</div>

												<div className='min-w-0'>
													<h3 className='text-base font-bold text-slate-900 dark:text-white truncate'>
														{provider.display_name}
													</h3>
													<p className='text-xs text-slate-400 dark:text-slate-400 mt-1 leading-relaxed'>
														{provider.description}
													</p>
												</div>
											</div>

											<div className='shrink-0'>
												{isConnected ? (
													<span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'>
														<CheckCircle2 className='w-3 h-3' />
														Connected
													</span>
												) : (
													<span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'>
														<ExternalLink className='w-3 h-3' />
														Not Setup
													</span>
												)}
											</div>
										</div>
									</div>

									<div className='mt-6 flex items-center justify-end gap-2'>
										{isConnected ? (
											<>
												<button
													type='button'
													onClick={() =>
														setDisconnectTarget({
															providerKey: provider.provider_key,
															name: provider.display_name,
														})
													}
													className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-all cursor-pointer'
												>
													<Trash2 className='w-3.5 h-3.5' />
													<span>Disconnect</span>
												</button>
												<button
													type='button'
													onClick={() => handleOpenConfigure(provider)}
													className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer'
												>
													<Pencil className='w-3.5 h-3.5' />
													<span>Edit</span>
												</button>
											</>
										) : (
											<button
												type='button'
												onClick={() => handleOpenConfigure(provider)}
												className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
											>
												<ExternalLink className='w-3.5 h-3.5' />
												<span>Connect</span>
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{isModalOpen && selectedProvider && selectedProvider.provider_key !== 'whatsapp' && (
					<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150'>
						<div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
							<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200'>
										{React.createElement(
											PROVIDER_ICONS[selectedProvider.provider_key] || MessageSquare,
											{
												className: 'w-5 h-5',
											},
										)}
									</div>
									<div>
										<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
											{selectedProvider.status === 'CONNECTED' ? 'Edit' : 'Connect'}{' '}
											{selectedProvider.display_name}
										</h3>
										<p className='text-xs text-slate-400'>{selectedProvider.description}</p>
									</div>
								</div>

								<button
									onClick={() => setIsModalOpen(false)}
									className='p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
								>
									<X className='w-5 h-5' />
								</button>
							</div>

							<form onSubmit={handleSaveConnect} className='p-6 space-y-4 overflow-y-auto'>
								{selectedProvider.schema?.fields?.map((field) => {
									const isPassword = field.type === 'password';
									const showPass = visiblePasswords[field.name];

									return (
										<div key={field.name} className='space-y-1.5'>
											<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300'>
												{field.label}{' '}
												{field.required && <span className='text-red-500'>*</span>}
											</label>

											<div className='relative'>
												<input
													type={isPassword && !showPass ? 'password' : 'text'}
													required={field.required}
													placeholder={field.placeholder}
													value={formData[field.name] || ''}
													onChange={(e) =>
														setFormData({ ...formData, [field.name]: e.target.value })
													}
													className='w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea] transition-colors'
												/>
												{isPassword && (
													<button
														type='button'
														onClick={() =>
															setVisiblePasswords((prev) => ({
																...prev,
																[field.name]: !prev[field.name],
															}))
														}
														className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer'
													>
														{showPass ? (
															<EyeOff className='w-4 h-4' />
														) : (
															<Eye className='w-4 h-4' />
														)}
													</button>
												)}
											</div>

											{field.help && (
												<p className='text-[11px] text-slate-400 leading-normal'>
													{field.help}
												</p>
											)}
										</div>
									);
								})}

								<div className='pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3'>
									<button
										type='button'
										onClick={() => setIsModalOpen(false)}
										className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer'
									>
										Close
									</button>

									<button
										type='submit'
										disabled={connectMutation.isPending}
										className='px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50'
									>
										{connectMutation.isPending
											? 'Saving & Verifying...'
											: selectedProvider.status === 'CONNECTED'
												? 'Save Changes'
												: 'Connect'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{selectedProvider && (
					<WhatsAppModal
						isOpen={isWhatsAppModalOpen && selectedProvider.provider_key === 'whatsapp'}
						onClose={() => setIsWhatsAppModalOpen(false)}
						provider={selectedProvider}
					/>
				)}

				<ConfirmDialog
					isOpen={Boolean(disconnectTarget)}
					title={`Disconnect ${disconnectTarget?.name || 'Integration'}`}
					description={`Are you sure you want to disconnect ${disconnectTarget?.name}? Saved credentials will be removed.`}
					confirmLabel='Disconnect'
					cancelLabel='Close'
					variant='danger'
					isLoading={disconnectMutation.isPending}
					onConfirm={handleConfirmDisconnect}
					onClose={() => setDisconnectTarget(null)}
				/>
			</div>
		</AppLayout>
	);
}
