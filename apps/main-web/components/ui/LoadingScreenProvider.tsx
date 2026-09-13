'use client';

import React, { useState, ReactNode } from 'react';
import LogoLoadingAnimation from './LogoLoadingAnimation';

interface LoadingScreenProviderProps {
  children: ReactNode;
}

export default function LoadingScreenProvider({ children }: LoadingScreenProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <LogoLoadingAnimation onFinished={handleLoadingComplete} />
        </div>
      )}
      {!isLoading && children}
    </>
  );
}