"use client";

import { ReactNode } from "react";
import { SplashScreenProvider } from "@/components/providers/SplashScreenProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SplashScreenProvider>
      {children}
    </SplashScreenProvider>
  );
} 