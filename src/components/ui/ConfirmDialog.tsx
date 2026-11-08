'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'danger' | 'warning' | 'primary';
	isLoading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function ConfirmDialog({
	isOpen,
	title,
	description,
	confirmLabel = 'Confirm',
	cancelLabel = 'Close',
	variant = 'danger',
	isLoading = false,
	onConfirm,
	onClose,
}: ConfirmDialogProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen && !isLoading) {
				onClose();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, isLoading, onClose]);

	if (!isOpen) return null;

	const confirmColors =
		variant === 'danger'
			? 'bg-red-600 hover:bg-red-700 text-white shadow-xs shadow-red-500/20'
			: 'bg-[#0073ea] hover:bg-[#005bb5] text-white shadow-xs shadow-blue-500/20';

	const IconComp = variant === 'danger' ? Trash2 : AlertTriangle;
	const iconColor = variant === 'danger' ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400';

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150'>
			<div
				className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150'
				role='alertdialog'
				aria-modal='true'
			>
				<div className='flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800'>
					<div className='flex items-center gap-3'>
						<div
							className={`w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${iconColor} shrink-0`}
						>
							<IconComp className='w-5 h-5' />
						</div>
						<div>
							<h3 className='text-base font-bold text-slate-900 dark:text-slate-100'>{title}</h3>
							<p className='text-xs text-slate-400'>Confirmation</p>
						</div>
					</div>

					<button
						type='button'
						onClick={onClose}
						disabled={isLoading}
						className='p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50'
					>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className='p-6'>
					<p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed'>{description}</p>
				</div>

				<div className='p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3'>
					<button
						type='button'
						onClick={onClose}
						disabled={isLoading}
						className='px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50'
					>
						{cancelLabel}
					</button>

					<button
						type='button'
						onClick={onConfirm}
						disabled={isLoading}
						className={`px-5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${confirmColors}`}
					>
						{isLoading ? 'Disconnecting...' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
