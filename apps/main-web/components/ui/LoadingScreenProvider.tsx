'use client';

import React, { useState, ReactNode } from 'react';
import LogoLoadingAnimation from './LogoLoadingAnimation';
import { useEffect } from 'react';

interface LoadingScreenProviderProps {
  children: ReactNode;
}

export default function LoadingScreenProvider({ children }: LoadingScreenProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem('smkn24-splash-shown') === '1';
    } catch {
      alreadyShown = false;
    }
    if (!reducedMotion && !alreadyShown) {
      setIsLoading(true);
      try {
        sessionStorage.setItem('smkn24-splash-shown', '1');
      } catch {
        // Splash remains usable when browser storage is disabled.
      }
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <div inert={isLoading || undefined} aria-hidden={isLoading || undefined}>
        {children}
      </div>
      {isLoading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          role="status"
          aria-label="Memuat website SMKN 24 Jakarta"
        >
          <LogoLoadingAnimation onFinished={handleLoadingComplete} />
        </div>
      )}
    </>
  );
}