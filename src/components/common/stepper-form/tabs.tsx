"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { useStepperForm } from "./context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface TabsProps {
  children: ReactNode;
  className?: string;
}

export function Tabs({ children, className = "" }: TabsProps) {
  const { activeTabIndex } = useStepperForm();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const isMobile = false;

  useEffect(() => {
    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);

    return () => {
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  useEffect(() => {
    if (tabsRef.current) {
      const tabElements = tabsRef.current.querySelectorAll(".stepper-tab");
      if (tabElements[activeTabIndex]) {
        const tabElement = tabElements[activeTabIndex] as HTMLElement;
        const tabsElement = tabsRef.current;

        const tabLeft = tabElement.offsetLeft;
        const tabWidth = tabElement.offsetWidth;
        const tabsWidth = tabsElement.offsetWidth;
        const tabsScrollLeft = tabsElement.scrollLeft;

        const targetScrollLeft = tabLeft - tabsWidth / 2 + tabWidth / 2;

        tabsElement.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [activeTabIndex]);

  const handleScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className={cn("stepper-tabs relative mb-8", className)}>
      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-1 flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
        )}

        <div
          ref={tabsRef}
          className="flex space-x-2 relative z-10 overflow-x-auto scrollbar-hide"
          onScroll={handleScroll}
        >
          {children}
        </div>

        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md rounded-full p-1 flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-100 rounded-full" />
    </div>
  );
}

interface TabProps {
  index: number;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  showCheckIcon?: boolean;
  clickDisabled?: boolean;
}

export function Tab({
  index,
  children,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
  showCheckIcon = true,
  clickDisabled = false,
}: TabProps) {
  const { activeTabIndex, setActiveTabIndex, validateTab,formState } = useStepperForm();

  const isActive = activeTabIndex === index;
  const isCompleted = activeTabIndex > index;

  const handleTabClick = () => {
    if (isCompleted) {
      setActiveTabIndex(index);
      return;
    }

    if (index > activeTabIndex) {
      console.log("formState : ",formState)
      const isValid = validateTab(activeTabIndex);
      if (isValid) {
        setActiveTabIndex(index);
      }
    }
  };

  return (
    <div
      className={cn(
        "stepper-tab relative py-3 px-4 cursor-pointer transition-colors duration-200 font-medium text-sm flex items-center whitespace-nowrap",
        isActive
          ? cn("text-red-600", activeClassName)
          : isCompleted
          ? cn("text-red-600", activeClassName)
          : cn("text-gray-500 hover:text-gray-700", inactiveClassName),
        cn(clickDisabled && "cursor-not-allowed"),
        className
      )}
      onClick={clickDisabled == false ? handleTabClick : () => {}}
    >
      {showCheckIcon && (
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center mr-2",
            isActive || isCompleted
              ? "bg-red-600 text-white"
              : "bg-gray-300 text-white"
          )}
        >
          <Check className="h-4 w-4" />
        </div>
      )}
      <span>{children}</span>
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-full"
          layoutId="activeTab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 40,
            mass: 1,
          }}
        />
      )}
      {/* {isCompleted && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-red-600" />
      )} */}
    </div>
  );
}
