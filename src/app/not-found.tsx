'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { AIPreventiveLogo } from '@/components/ui/AIPreventiveLogo';

export default function NotFound() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div className='min-h-screen bg-white dark:bg-[#0a0d14] flex items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden transition-colors'>
			<div className='w-full flex flex-col lg:block'>
				{/* Mobile Brand */}
				<div className='block lg:hidden mx-auto mb-6'>
					<div className='flex items-center gap-2.5'>
						<AIPreventiveLogo className='w-8 h-8 text-[#0073ea]' />
						<div className='text-xl font-bold tracking-tight text-slate-900 dark:text-white'>
							Protect<span className='text-[#ff7a59]'>Q</span>ube <span className='text-[#0073ea]'>AIOPS</span>
						</div>
					</div>
				</div>

				{/* Illustration Right */}
				<div className='w-full max-w-md mx-auto mb-8 lg:mb-0 lg:absolute lg:right-24 lg:top-1/2 lg:-translate-y-1/2 lg:w-1/2 lg:max-w-xl lg:mx-0'>
					<Image
						src='/images/404.png'
						alt='404 Not Found Illustration'
						width={900}
						height={900}
						className='w-full h-auto object-contain drop-shadow-md'
						priority
					/>
				</div>

				{/* Content Left */}
				<div className='relative z-10 w-full max-w-7xl mx-auto'>
					<div className='flex flex-col items-center text-center lg:text-left lg:items-start space-y-4 md:space-y-6 lg:max-w-xl'>
						{/* Desktop Brand */}
						<div className='hidden lg:block mb-8 md:mb-12'>
							<div className='flex items-center gap-2.5'>
								<AIPreventiveLogo className='w-9 h-9 text-[#0073ea]' />
								<div className='text-2xl font-bold tracking-tight text-slate-900 dark:text-white'>
									Protect<span className='text-[#ff7a59]'>Q</span>ube <span className='text-[#0073ea]'>AIOPS</span>
								</div>
							</div>
						</div>

						<div className='space-y-2'>
							<div className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60'>
								<FileQuestion className='w-3.5 h-3.5' />
								<span>Error 404 &bull; Page Not Found</span>
							</div>

							<h1 className='text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight'>
								Ooops...
							</h1>
							<p className='text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-300'>
								Page Not Found
							</p>
						</div>

						<p className='text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-md'>
							The page you are looking for might have been removed, had its route changed, or is temporarily unavailable.
						</p>

						<div className='pt-2'>
							<Link
								href='/'
								className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0073ea] hover:bg-[#005bb5] text-white text-sm font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer'
							>
								<ArrowLeft className='w-4 h-4' />
								<span>Back to Home</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

