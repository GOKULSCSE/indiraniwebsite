"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [showCircle, setShowCircle] = useState(false);
  const [expandCircle, setExpandCircle] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCircle(true), 300);
    const timer2 = setTimeout(() => setExpandCircle(true), 800);
    const timer3 = setTimeout(() => setShowLogo(true), 1400);
    const timer4 = setTimeout(() => setShowText(true), 1800);
    const timer5 = setTimeout(() => setIntroComplete(true), 5500);
    const timer6 = setTimeout(() => onComplete(), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!introComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
        >
          {/* Expanding Red Circle */}
          <AnimatePresence>
            {showCircle && (
              <motion.div
                className="absolute bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-full flex items-center justify-center"
                initial={{ 
                  width: 0,
                  height: 0,
                  opacity: 0
                }}
                animate={{ 
                  width: expandCircle ? "200vmax" : 120,
                  height: expandCircle ? "200vmax" : 120,
                  opacity: 1
                }}
                transition={{
                  duration: expandCircle ? 1.2 : 0.6,
                  ease: "easeInOut"
                }}
              >
                {/* Logo - visible only in small circle state */}
                {!expandCircle && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center"
                  >
                    <img 
                      src="/assets/indiranilogo.png"
                      alt="Kaaladi Handicrafts"
                      width={32}
                      height={32}
                      className="w-8 h-8"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content after expansion */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo appears first */}
            <AnimatePresence>
              {showLogo && expandCircle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
                >
                  {/* Blinking circular border */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/80"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 0.2, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <img 
                    src="/assets/indiranilogo.png"
                    alt="Kaaladi Handicrafts"
                    width={40}
                    height={40}
                    className="w-10 h-10 relative z-10"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text appears after logo with left-to-right animation */}
            <AnimatePresence>
              {showText && showLogo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  {/* Brand Name with letter-by-letter animation */}
                  <div className="flex overflow-hidden mb-2">
                    {"Make U Easy".split("").map((char, index) => (
                      <motion.span
                        key={index}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                        className="text-3xl font-bold text-white tracking-wider"
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </div>
                  
                  {/* Animated line */}
                  <motion.div
                    className="h-0.5 bg-white/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: 64 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  />

                  {/* Tagline with simple fade-in animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="mt-4 text-white/90 flex flex-col items-center"
                  >
                    <motion.div
                      className="text-lg font-medium tracking-wide mb-2"
                    >
                      Your Ultimate Shopping Destination
                    </motion.div>

                    {/* Loading text with fade animation */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.0, duration: 0.8 }}
                      className="text-sm font-light text-white/80"
                    >
                      Preparing your shopping experience...
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Intro;
