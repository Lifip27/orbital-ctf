'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SpaceScene from '@/components/SpaceScene';
import { fetchSiteConfigurations } from '@/utils/api';

export default function Home() {
  const [title, setTitle] = useState('Welcome to PwnCTF');
  const [subtitle, setSubtitle] = useState('80s retro ui, space-themed, batteries included.');

  useEffect(() => {
    fetchSiteConfigurations()
      .then((configs) => {
        const titleConfig = configs.find(c => c.key === 'homepage_title');
        const subtitleConfig = configs.find(c => c.key === 'homepage_subtitle');
        
        if (titleConfig) setTitle(titleConfig.value);
        if (subtitleConfig) setSubtitle(subtitleConfig.value);
      })
      .catch(error => {
        console.error('Failed to load site configuration:', error);
      });
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="pointer-events-none absolute inset-0">
        <SpaceScene isMobile={false} />
      </div>
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center p-8 border bg-black/90">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
              {title}
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-300">
              {subtitle}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              <Link
                href="/auth/signup"
                className="px-6 py-3 border border-white hover:text-blue-500 hover:border-blue-500 whitespace-nowrap"
              >
                Register
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-3 border border-gray-400 text-gray-400 hover:text-blue-500 hover:border-blue-500 whitespace-nowrap"
              >
                Log In
              </Link>
              <Link
                href="/rules"
                className="px-6 py-3 border border-gray-400 text-gray-400 hover:text-blue-500 hover:border-blue-500 whitespace-nowrap"
              >
                Rules
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
