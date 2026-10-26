'use client';

import React, { useState, ReactNode } from 'react';
import LogoLoadingAnimation from './LogoLoadingAnimation';
import { useEffect } from 'react';

interface LoadingScreenProviderProps {
  children: ReactNode;
}

export default function LoadingScreenProvider({ children }: LoadingScreenProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    try {
      if (sessionStorage.getItem('smkn24-splash-shown') === '1') return;
      sessionStorage.setItem('smkn24-splash-shown', '1');
    } catch {
      // Splash remains usable when browser storage is disabled.
    }

    const frame = window.requestAnimationFrame(() => setIsLoading(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleLoadingComplete = () => {
    setIsFadingOut(true);
  };

  return (
    <>
      <div inert={isLoading || undefined} aria-hidden={isLoading || undefined}>
        {children}
      </div>
      {isLoading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-700 ease-in-out"
          style={{ opacity: isFadingOut ? 0 : 1 }}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== "opacity") return;
            setIsLoading(false);
            setIsFadingOut(false);
          }}
          role="status"
          aria-label="Memuat website SMKN 24 Jakarta"
        >
          <LogoLoadingAnimation onFinished={handleLoadingComplete} />
        </div>
      )}
    </>
  );
}
