"use client"

import * as React from "react"
import { motion, MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

const scrollbarHideStyles = `
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
`;

function ScrollbarStyles() {
  return <style jsx global>{scrollbarHideStyles}</style>;
}

type TabsContextValue = {
  activeTab: string
  setActiveTab: (id: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider")
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: TabsProps) {
  const [activeTab, setActiveTabInternal] = React.useState(defaultValue || "")

  const setActiveTab = React.useCallback(
    (id: string) => {
      if (onValueChange) {
        onValueChange(id)
      } else {
        setActiveTabInternal(id)
      }
    },
    [onValueChange],
  )

  const contextValue = React.useMemo(
    () => ({
      activeTab: value !== undefined ? value : activeTab,
      setActiveTab,
    }),
    [activeTab, setActiveTab, value],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <ScrollbarStyles />
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function TabsList({ children, className, ...props }: TabsListProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = React.useState(false);
  const [showRightButton, setShowRightButton] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftButton(container.scrollLeft > 0);
      setShowRightButton(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full mb-8">
      {showLeftButton && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md p-1.5"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex flex-nowrap overflow-x-auto scrollbar-none py-2 px-6",
          "justify-start gap-4 scroll-smooth",
          className
        )} 
        {...props}
      >
        {children}
      </div>
      
      {showRightButton && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md p-1.5"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      className={cn(
        "relative px-4 py-2 text-sm md:text-[1.1rem] tracking-wide transition-colors cursor-pointer font-bold",
        "whitespace-nowrap flex-shrink-0",
        isActive ? "" : "text-gray-600",
        className,
      )}
      style={isActive ? { color: '#D3B750' } : {}}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 w-full h-0.5 md:block hidden"
          style={{ backgroundColor: '#D3B750' }}
          layoutId="tab-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { activeTab } = useTabs()
  const isActive = activeTab === value

  return isActive ? (
    <motion.div
      className={cn("mt-2", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      {...(props as MotionProps)}
    >
      {children}
    </motion.div>
  ) : null
}

export { Tabs, TabsList, TabsTrigger, TabsContent, useTabs }

