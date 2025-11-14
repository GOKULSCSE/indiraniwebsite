"use client";

import type { ReactElement, ReactNode } from "react";
import { useStepperForm } from "./context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TabContentProps {
  index: number;
  // children: ReactNode
  children: (({index}:{index:number}) => ReactNode) | ReactElement;
  className?: string;
}

export function TabContent({
  index,
  children,
  className = "",
}: TabContentProps) {
  const { activeTabIndex } = useStepperForm();

  return (
    <AnimatePresence mode="wait">
      {activeTabIndex === index && (
        <motion.div
          key={`tab-content-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn("stepper-tab-content py-4", className)}
        >
           {typeof children === "function" ? children({ index }) : children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
