'use client';

import React, { useState } from 'react';
import { useIntegrations, useConnectIntegration, useDisconnectIntegration } from '@/store/api/integrations';
import { IIntegrationProvider } from '@/types/notifications';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WhatsAppModal } from '@/components/integrations/WhatsAppModal';
import {
	Send,
	MessageSquare,
	Mail,
	Slack,
	Eye,
	EyeOff,
	X,
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
	discord: { bg: 'bg-[#5865F2]/10 dark:bg-[#5865F2]/20', text: 'text-[#5865F2]', ring: 'ring-[#5865F2]/30' },
	telegram: { bg: 'bg-[#229ED9]/10 dark:bg-[#229ED9]/20', text: 'text-[#229ED9]', ring: 'ring-[#229ED9]/30' },
	whatsapp: { bg: 'bg-[#25D366]/10 dark:bg-[#25D366]/20', text: 'text-[#25D366]', ring: 'ring-[#25D366]/30' },
	email: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-500', ring: 'ring-amber-500/30' },
	slack: { bg: 'bg-[#4A154B]/10 dark:bg-[#4A154B]/20', text: 'text-[#E01E5A]', ring: 'ring-[#E01E5A]/30' },
};

export const IntegrationsTab: React.FC = () => {
	const { data: providers = [], isLoading } = useIntegrations();
	const connectMutation = useConnectIntegration();
	const disconnectMutation = useDisconnectIntegration();

	const [configModal, setConfigModal] = useState<IIntegrationProvider | null>(null);
	const [formValues, setFormValues] = useState<Record<string, string>>({});
	const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
	const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
	const [disconnectTarget, setDisconnectTarget] = useState<IIntegrationProvider | null>(null);

	const handleOpenConnect = (provider: IIntegrationProvider) => {
		if (provider.provider_key === 'whatsapp') {
			setConfigModal(provider);
			setIsWhatsAppModalOpen(true);
			return;
		}

		setConfigModal(provider);
		const initialValues: Record<string, string> = {};
		provider.schema?.fields?.forEach((f) => {
			initialValues[f.name] = (provider.config?.[f.name] as string) || '';
		});
		setFormValues(initialValues);
		setShowSecrets({});
	};

	const handleSubmitConfig = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!configModal) return;

		try {
			await connectMutation.mutateAsync({
				providerKey: configModal.provider_key,
				name: configModal.display_name,
				config: formValues,
			});
			toast.success(`${configModal.display_name} connected successfully!`);
			setConfigModal(null);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Connection failed');
		}
	};

	const handleConfirmDisconnect = async () => {
		if (!disconnectTarget) return;

		try {
			await disconnectMutation.mutateAsync(disconnectTarget.provider_key);
			toast.success(`${disconnectTarget.display_name} disconnected`);
			setDisconnectTarget(null);
		} catch (err: unknown) {
			const error = err as Error;
			toast.error(error.message || 'Disconnection failed');
		}
	};

	const whatsappProvider =
		providers.find((p) => p.provider_key === 'whatsapp') ||
		configModal ||
		({
			provider_key: 'whatsapp',
			display_name: 'WhatsApp',
			description: '',
			icon: 'whatsapp',
			status: 'NOT_CONFIGURED',
			schema: { fields: [] },
			config: {},
		} as IIntegrationProvider);

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
					Connected Integrations
				</h2>
				<p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
					Configure alert distribution channels and communication gateways
				</p>
			</div>

			{isLoading ? (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className='h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse' />
					))}
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
					{providers.map((p) => {
						const Icon = PROVIDER_ICONS[p.provider_key] || MessageSquare;
						const colors = PROVIDER_COLORS[p.provider_key] || {
							bg: 'bg-slate-500/10',
							text: 'text-slate-500',
							ring: 'ring-slate-500/30',
						};
						const isConnected = p.status === 'CONNECTED';

						return (
							<div
								key={p.provider_key}
								className='flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#121c2f] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all'
							>
								<div>
									<div className='flex items-start justify-between gap-3 mb-4'>
										<div className={`p-3 rounded-xl ${colors.bg} ${colors.text} shrink-0`}>
											<Icon className='w-6 h-6' />
										</div>

										<span
											className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
												isConnected
													? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
													: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
											}`}
										>
											{isConnected ? 'Connected' : 'Not Configured'}
										</span>
									</div>

									<h3 className='text-sm font-bold text-slate-900 dark:text-slate-100 mb-1'>
										{p.display_name}
									</h3>
									<p className='text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4'>
										{p.description}
									</p>
								</div>

								<div className='flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80'>
									{isConnected ? (
										<>
											<button
												onClick={() => handleOpenConnect(p)}
												className='flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer'
											>
												<Pencil className='w-3.5 h-3.5' />
												<span>Configure</span>
											</button>
											<button
												onClick={() => setDisconnectTarget(p)}
												className='p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer'
												title='Disconnect'
											>
												<Trash2 className='w-4 h-4' />
											</button>
										</>
									) : (
										<button
											onClick={() => handleOpenConnect(p)}
											className='w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
										>
											Connect Integration
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Connect / Edit Modal */}
			{configModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150'>
					<div className='bg-white dark:bg-[#121c2f] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'>
						<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0073ea] dark:text-[#3894ff] shrink-0'>
									{(() => {
										const Icon = PROVIDER_ICONS[configModal.provider_key] || MessageSquare;
										return <Icon className='w-5 h-5' />;
									})()}
								</div>
								<div>
									<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
										Configure {configModal.display_name}
									</h3>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										Set credentials and endpoints
									</p>
								</div>
							</div>

							<button
								type='button'
								onClick={() => setConfigModal(null)}
								disabled={connectMutation.isPending}
								className='p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
							>
								<X className='w-5 h-5' />
							</button>
						</div>

						<form onSubmit={handleSubmitConfig} className='p-6 space-y-4 overflow-y-auto flex-1'>
							{configModal.schema?.fields?.map((f) => {
								const isSecret = f.type === 'password';
								const isVisible = showSecrets[f.name];

								return (
									<div key={f.name}>
										<div className='flex items-center justify-between mb-1.5'>
											<label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>
												{f.label} {f.required && <span className='text-rose-500'>*</span>}
											</label>
											{f.help && (
												<span className='text-[10px] text-slate-400'>{f.help}</span>
											)}
										</div>

										<div className='relative'>
											<input
												type={isSecret && !isVisible ? 'password' : 'text'}
												required={f.required}
												value={formValues[f.name] || ''}
												onChange={(e) =>
													setFormValues({ ...formValues, [f.name]: e.target.value })
												}
												placeholder={f.placeholder}
												className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0073ea]'
											/>
											{isSecret && (
												<button
													type='button'
													onClick={() =>
														setShowSecrets({ ...showSecrets, [f.name]: !isVisible })
													}
													className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
												>
													{isVisible ? (
														<EyeOff className='w-4 h-4' />
													) : (
														<Eye className='w-4 h-4' />
													)}
												</button>
											)}
										</div>
									</div>
								);
							})}

							<div className='pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3'>
								<button
									type='button'
									onClick={() => setConfigModal(null)}
									disabled={connectMutation.isPending}
									className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={connectMutation.isPending}
									className='flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 disabled:opacity-50'
								>
									{connectMutation.isPending ? 'Verifying...' : 'Save & Connect'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<WhatsAppModal
				isOpen={isWhatsAppModalOpen}
				onClose={() => setIsWhatsAppModalOpen(false)}
				provider={whatsappProvider}
			/>

			<ConfirmDialog
				isOpen={Boolean(disconnectTarget)}
				title='Disconnect Channel'
				description={`Are you sure you want to disconnect ${disconnectTarget?.display_name}? Notifications routed to this provider will pause.`}
				confirmLabel='Disconnect'
				variant='danger'
				isLoading={disconnectMutation.isPending}
				onConfirm={handleConfirmDisconnect}
				onClose={() => setDisconnectTarget(null)}
			/>
		</div>
	);
};
