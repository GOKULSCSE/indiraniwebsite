"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import SplashScreen from '../SplashScreen';
import { usePathname, useSearchParams } from 'next/navigation';

interface SplashScreenContextType {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const SplashScreenContext = createContext<SplashScreenContextType | undefined>(undefined);

export const useSplashScreen = () => {
  const context = useContext(SplashScreenContext);
  if (!context) {
    throw new Error('useSplashScreen must be used within a SplashScreenProvider');
  }
  return context;
};

export function SplashScreenProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplashOnFirstLoad, setShowSplashOnFirstLoad] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Show splash screen only on first load of the application
  useEffect(() => {
    // Check if this is the first load of the session
    // Safe check for localStorage (only available in browser)
    const hasSeenSplash = typeof window !== 'undefined' ? localStorage.getItem('hasSeenSplash') : null;
    
    if (!hasSeenSplash && showSplashOnFirstLoad) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowSplashOnFirstLoad(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('hasSeenSplash', 'true');
        }
      }, 5000); // Show splash screen for 5 seconds

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
      setShowSplashOnFirstLoad(false);
    }
  }, [showSplashOnFirstLoad]);

  // When route changes, we don't want to show splash screen
  useEffect(() => {
    if (!showSplashOnFirstLoad) {
      setIsLoading(false);
    }
  }, [pathname, searchParams, showSplashOnFirstLoad]);

  return (
    <SplashScreenContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading ? <SplashScreen /> : children}
    </SplashScreenContext.Provider>
  );
} 