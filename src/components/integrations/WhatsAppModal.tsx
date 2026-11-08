'use client';

import React, { useState, useEffect } from 'react';
import { IIntegrationProvider } from '@/types/notifications';
import { useWhatsAppStatus, useGenerateWhatsAppQR, usePairWhatsAppPhone } from '@/store/api/integrations';
import { QrCode, Smartphone, X, RotateCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.76.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm5.43 14.38c-.22.62-1.12 1.15-1.82 1.3-.47.1-1.08.18-3.15-.67-2.64-1.09-4.34-3.78-4.47-3.96-.13-.17-1.06-1.42-1.06-2.7 0-1.28.67-1.92.91-2.18.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.81.81 1.94.07.13.11.28.02.46-.09.17-.13.28-.26.43-.13.15-.27.34-.39.46-.13.13-.27.27-.12.53.15.26.68 1.12 1.45 1.81.99.89 1.83 1.16 2.09 1.29.26.13.41.11.56-.06.15-.17.65-.76.83-1.02.17-.26.35-.22.59-.13.24.09 1.52.72 1.78.85.26.13.43.2.5.3.07.11.07.63-.15 1.25Z'
		/>
	</svg>
);

interface WhatsAppModalProps {
	isOpen: boolean;
	onClose: () => void;
	provider: IIntegrationProvider;
}

export function WhatsAppModal({ isOpen, onClose, provider }: WhatsAppModalProps) {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<'qr' | 'pairing'>('qr');
	const [pairingPhone, setPairingPhone] = useState('');
	const [pairingCode, setPairingCode] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [isGeneratingQr, setIsGeneratingQr] = useState(false);

	const { data: status, refetch: refetchStatus } = useWhatsAppStatus(isOpen, 2500);
	const generateQrMutation = useGenerateWhatsAppQR();
	const pairPhoneMutation = usePairWhatsAppPhone();

	const isConnected = provider.status === 'CONNECTED' || Boolean(status?.is_logged_in);

	useEffect(() => {
		if (status?.is_logged_in && provider.status !== 'CONNECTED') {
			queryClient.invalidateQueries({ queryKey: ['integrations'] });
			toast.success('WhatsApp connected successfully!');
		}
	}, [status?.is_logged_in, provider.status, queryClient]);

	if (!isOpen) return null;

	const handleGenerateQr = async () => {
		try {
			setIsGeneratingQr(true);
			await generateQrMutation.mutateAsync();
			await refetchStatus();
		} catch (err: any) {
			toast.error(err.message || 'Failed to generate QR code');
		} finally {
			setIsGeneratingQr(false);
		}
	};

	const handleRequestPairingCode = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!pairingPhone.trim()) {
			toast.error('Please enter your phone number');
			return;
		}
		try {
			const res = await pairPhoneMutation.mutateAsync(pairingPhone.trim());
			setPairingCode(res.code);
			toast.success('Pairing code generated! Check your phone.');
			await refetchStatus();
		} catch (err: any) {
			toast.error(err.message || 'Failed to request pairing code');
		}
	};

	const handleCopyPairingCode = () => {
		if (!pairingCode) return;
		navigator.clipboard.writeText(pairingCode.replace(/-/g, ''));
		setCopied(true);
		toast.success('Pairing code copied to clipboard');
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150'>
			<div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
				<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200'>
							<WhatsAppIcon className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
						</div>
						<div>
							<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>
								{isConnected ? 'Edit WhatsApp' : 'Connect WhatsApp'}
							</h3>
							<p className='text-xs text-slate-400'>
								{provider.description || 'Connect via Linked Device (QR Code or Pairing Code)'}
							</p>
						</div>
					</div>

					<button
						onClick={onClose}
						className='p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				{isConnected && (
					<div className='mx-6 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between'>
						<div className='flex items-center gap-2.5 min-w-0'>
							<div className='w-2 h-2 rounded-full bg-emerald-500 shrink-0' />
							<div className='text-xs truncate'>
								<span className='font-semibold text-slate-700 dark:text-slate-300 mr-1.5'>
									Connected Account:
								</span>
								<span className='font-mono font-bold text-slate-900 dark:text-white'>
									{status?.phone || status?.jid || 'Active'}
								</span>
							</div>
						</div>
						<span className='text-[11px] font-medium text-slate-400 shrink-0'>Re-pair to switch</span>
					</div>
				)}

				<div className='flex justify-center pt-4 pb-1 px-6'>
					<div className='bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 w-full max-w-xs'>
						<button
							type='button'
							onClick={() => setActiveTab('qr')}
							className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								activeTab === 'qr'
									? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
									: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
							}`}
						>
							<QrCode className='w-4 h-4' />
							<span>QR Code</span>
						</button>

						<button
							type='button'
							onClick={() => setActiveTab('pairing')}
							className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								activeTab === 'pairing'
									? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
									: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
							}`}
						>
							<Smartphone className='w-4 h-4' />
							<span>Pairing Code</span>
						</button>
					</div>
				</div>

				{activeTab === 'qr' ? (
					<div className='p-6'>
						{status?.qr_code ? (
							<div className='text-center flex flex-col items-center space-y-4'>
								<div className='p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs inline-block'>
									<img
										src={status.qr_code}
										alt='WhatsApp QR Code'
										className='w-52 h-52 object-contain'
									/>
								</div>

								<div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#0073ea] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'>
									<span className='relative flex h-2 w-2'>
										<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
										<span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
									</span>
									<span>Waiting for scan...</span>
								</div>

								<div className='w-full text-xs text-slate-400 text-left max-w-sm bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5'>
									<p>1. Open WhatsApp on your phone</p>
									<p>
										2. Tap <b>Settings</b> or <b>Menu</b> &gt; <b>Linked Devices</b>
									</p>
									<p>
										3. Tap <b>Link a Device</b> and point camera at this screen
									</p>
								</div>
							</div>
						) : (
							<div className='py-8 text-center flex flex-col items-center'>
								<div className='w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0073ea] dark:text-blue-400 mb-3.5'>
									<QrCode className='w-6 h-6' />
								</div>
								<h4 className='text-sm font-bold text-slate-900 dark:text-white mb-1'>
									{isConnected ? 'Re-generate QR Code' : 'Link with QR Code'}
								</h4>
								<p className='text-xs text-slate-400 max-w-xs leading-relaxed'>
									{isConnected
										? 'Generate a new QR code to scan and switch to a different WhatsApp account.'
										: "Generate a QR code to scan with your phone's WhatsApp application."}
								</p>
							</div>
						)}
					</div>
				) : (
					<div className='p-6'>
						<div className='text-center flex flex-col items-center max-w-sm mx-auto'>
							<div className='w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0073ea] dark:text-blue-400 mb-3.5'>
								<Smartphone className='w-6 h-6' />
							</div>
							<h4 className='text-sm font-bold text-slate-900 dark:text-white mb-1'>
								{isConnected ? 'Change Linked Phone Number' : 'Link with Pairing Code'}
							</h4>
							<p className='text-xs text-slate-400 max-w-xs leading-relaxed mb-4'>
								{isConnected
									? 'Enter a new phone number to receive an 8-digit code and switch your WhatsApp account.'
									: 'Enter your phone number to receive an 8-digit pairing code to enter in your WhatsApp app.'}
							</p>

							<form onSubmit={handleRequestPairingCode} className='w-full text-left space-y-1.5'>
								<label className='block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Phone Number <span className='text-red-500'>*</span>
								</label>
								<input
									type='tel'
									placeholder='+62 812 3456 7890'
									value={pairingPhone}
									onChange={(e) => setPairingPhone(e.target.value)}
									className='w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0073ea] transition-colors'
								/>
							</form>

							{pairingCode && (
								<div className='w-full mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center'>
									<p className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2'>
										Your 8-Digit Pairing Code
									</p>
									<div className='flex items-center justify-center gap-2'>
										<span className='font-mono text-xl font-bold tracking-widest text-[#0073ea] dark:text-[#38bdf8] bg-white dark:bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs'>
											{pairingCode}
										</span>
										<button
											type='button'
											onClick={handleCopyPairingCode}
											className='p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer'
										>
											{copied ? (
												<Check className='w-4 h-4 text-emerald-500' />
											) : (
												<Copy className='w-4 h-4' />
											)}
										</button>
									</div>
									<p className='text-xs text-slate-400 mt-2.5 leading-relaxed'>
										Open WhatsApp &gt; <b>Linked Devices</b> &gt;{' '}
										<b>Link with phone number instead</b>, then enter this code.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				<div className='pt-4 p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3'>
					<button
						type='button'
						onClick={onClose}
						className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer'
					>
						Close
					</button>

					{activeTab === 'qr' ? (
						<button
							type='button'
							disabled={isGeneratingQr || generateQrMutation.isPending}
							onClick={handleGenerateQr}
							className='px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2'
						>
							{(isGeneratingQr || generateQrMutation.isPending) && (
								<RotateCw className='w-3.5 h-3.5 animate-spin' />
							)}
							<span>
								{isGeneratingQr || generateQrMutation.isPending
									? 'Generating...'
									: status?.qr_code
										? 'Refresh QR Code'
										: isConnected
											? 'Re-generate QR Code'
											: 'Generate QR Code'}
							</span>
						</button>
					) : (
						<button
							type='button'
							disabled={pairPhoneMutation.isPending}
							onClick={() => handleRequestPairingCode()}
							className='px-5 py-2 text-xs font-semibold rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2'
						>
							{pairPhoneMutation.isPending && <RotateCw className='w-3.5 h-3.5 animate-spin' />}
							<span>
								{pairPhoneMutation.isPending
									? 'Requesting...'
									: pairingCode
										? 'Get New Code'
										: isConnected
											? 'Change & Pair Number'
											: 'Get Pairing Code'}
							</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
