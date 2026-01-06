'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { TfiMenu } from "react-icons/tfi";
import { fetchSiteConfigurations } from '@/utils/api';
import { SiteConfiguration } from '@/types';

interface CRTEffects {
  scanlines: boolean;
  flicker: boolean;
  phosphor: boolean;
  glow: boolean;
  rollingScan: boolean;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCrtMenuOpen, setIsCrtMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [crtEffects, setCrtEffects] = useState<CRTEffects>({
    scanlines: true,
    flicker: true,
    phosphor: true,
    glow: true,
    rollingScan: true,
  });
  const [title, setTitle] = useState('PWNCTF');

  const navRef = useRef<HTMLDivElement>(null);
  const crtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSiteConfigurations()
      .then((configs: SiteConfiguration[]) => {
        const titleConfig = configs.find(c => c.key === 'site_title');
        if (titleConfig) setTitle(titleConfig.value);
      })
      .catch(error => {
        console.error('Failed to fetch site configuration:', error);
      });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crtEffects');
      if (stored !== null) {
        setCrtEffects(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNavOpen(false);
      }
      if (crtRef.current && !crtRef.current.contains(event.target as Node)) {
        setIsCrtMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('crt-scanlines-disabled', !crtEffects.scanlines);
    document.body.classList.toggle('crt-flicker-disabled', !crtEffects.flicker);
    document.body.classList.toggle('crt-phosphor-disabled', !crtEffects.phosphor);
    document.body.classList.toggle('crt-glow-disabled', !crtEffects.glow);
    document.body.classList.toggle('crt-rolling-scan-disabled', !crtEffects.rollingScan);
    localStorage.setItem('crtEffects', JSON.stringify(crtEffects));
  }, [crtEffects]);

  const toggleEffect = (effect: keyof CRTEffects) => {
    setCrtEffects(prev => ({
      ...prev,
      [effect]: !prev[effect]
    }));
  };

  const handleNavigation = () => {
    setIsNavOpen(false);
  };

  return (
    <nav className={`z-50 fixed flex justify-center w-full pointer-events-none ${isMobileMenuOpen ? 'bg-black' : ''} sm:bg-transparent ${isMobileMenuOpen ? 'border-b border-white/20' : ''} sm:border-none`}>
      <div className="w-full max-w-3xl px-4 sm:px-6 lg:mx-8">
        <div className="flex items-center h-16">
          {/* Left Navigation Button - Hidden on mobile */}
          <div className="hidden sm:flex items-center justify-start flex-1">
            <div className="relative" ref={navRef}>
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className={`text-gray-300 hover:text-white py-2 text-sm font-medium relative pointer-events-auto ${
                  isNavOpen ? 'border-b-2 border-white' : 'hover:border-b-2 hover:border-white'
                }`}
              >
                Navigation
              </button>

              {/* Navigation Menu */}
              {isNavOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-48 bg-black border pointer-events-auto">
                  {/* Profile Section at Top */}
                  {status === 'authenticated' ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={handleNavigation}
                      >  
                        <span>Profile</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={handleNavigation}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={handleNavigation}
                      >
                        Sign Up
                      </Link>
                      <div className="border-b border-gray-700 my-2"></div>
                    </>
                  )}

                  {/* Navigation Links */}
                  <Link
                    href="/dashboard"
                    className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 ${
                      pathname === '/dashboard' ? '' : ''
                    }`}
                    onClick={handleNavigation}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/scoreboard"
                    className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 ${
                      pathname === '/scoreboard' ? '' : ''
                    }`}
                    onClick={handleNavigation}
                  >
                    Scoreboard
                  </Link>
                  <Link
                    href="/rules"
                    className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 ${
                      pathname === '/rules' ? '' : ''
                    }`}
                    onClick={handleNavigation}
                  >
                    Rules
                  </Link>
                  {session?.user?.isAdmin && (
                    <Link
                      href="/admin"
                      className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 ${
                        pathname === '/admin' ? 'bg-gray-700' : ''
                      }`}
                      onClick={handleNavigation}
                    >
                      Admin
                    </Link>
                  )}
                  {status === 'authenticated' && (
                    <Link
                      href="/api/auth/signout"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={handleNavigation}
                    >
                      Sign Out
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title - Left on mobile, centered on desktop */}
          <div className="flex-1 sm:flex-none">
            <Link 
              href={status === 'authenticated' ? "/dashboard" : "/"} 
              className="text-xl font-bold text-white uppercase pointer-events-auto"
            >
              {title?.toUpperCase() || "PWNCTF"}
            </Link>
          </div>

          {/* Right side controls */}
          <div className="flex items-center justify-end flex-1">
            {/* Mobile Menu Button */}
            <div className="flex sm:hidden">
              <button
                className="pointer-events-auto text-gray-300 hover:text-white"
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsNavOpen(false);
                  setIsCrtMenuOpen(false);
                }}
              >
                <TfiMenu className="h-6 w-6" />
              </button>
            </div>

            {/* Desktop Right Side Controls */}
            <div className="hidden sm:flex items-center gap-4 pointer-events-auto">
              {/* Right Navigation Button */}
              <div className="relative" ref={crtRef}>
                <button
                  onClick={() => setIsCrtMenuOpen(!isCrtMenuOpen)}
                  className={`text-gray-300 hover:text-white py-2 text-sm font-medium flex items-center ${
                    isCrtMenuOpen ? 'border-b-2 border-white' : 'hover:border-b-2 hover:border-white'
                  }`}
                >
                  Settings
                </button>

                {/* Settings Menu */}
                {isCrtMenuOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-48 bg-black border">
                    <div
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleEffect('scanlines')}
                    >
                      Scanlines {crtEffects.scanlines ? '☑' : '☐'}
                    </div>
                    <div
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleEffect('flicker')}
                    >
                      Screen Flicker {crtEffects.flicker ? '☑' : '☐'}
                    </div>
                    <div
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleEffect('phosphor')}
                    >
                      Text Glow {crtEffects.phosphor ? '☑' : '☐'}
                    </div>
                    <div
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleEffect('glow')}
                    >
                      Background Glow {crtEffects.glow ? '☑' : '☐'}
                    </div>
                    <div
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                      onClick={() => toggleEffect('rollingScan')}
                    >
                      Rolling Scan {crtEffects.rollingScan ? '☑' : '☐'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden absolute top-16 left-0 right-0 bg-black border-t border-white/20 pointer-events-auto">
              {/* Mobile Navigation Links */}
              {status === 'authenticated' ? (
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <div className="border-b border-gray-700 my-2"></div>
                </>
              )}

              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/scoreboard"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Scoreboard
              </Link>
              <Link
                href="/rules"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rules
              </Link>
              {session?.user?.isAdmin && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {status === 'authenticated' && (
                <Link
                  href="/api/auth/signout"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Out
                </Link>
              )}

              {/* Mobile Settings */}
              <div className="border-t border-gray-700 mt-2"></div>
              <div
                className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => toggleEffect('scanlines')}
              >
                Scanlines {crtEffects.scanlines ? '☑' : '☐'}
              </div>
              <div
                className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => toggleEffect('flicker')}
              >
                Screen Flicker {crtEffects.flicker ? '☑' : '☐'}
              </div>
              <div
                className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => toggleEffect('phosphor')}
              >
                Text Glow {crtEffects.phosphor ? '☑' : '☐'}
              </div>
              <div
                className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => toggleEffect('glow')}
              >
                Background Glow {crtEffects.glow ? '☑' : '☐'}
              </div>
              <div
                className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                onClick={() => toggleEffect('rollingScan')}
              >
                Rolling Scan {crtEffects.rollingScan ? '☑' : '☐'}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}