"use client";
import React, { useEffect, useRef } from "react";
import Script from "next/script";

interface RazorpayAffordabilityWidgetProps {
  amount: number; // Amount in paise
  keyId: string; // Razorpay key ID
  className?: string;
  onWidgetLoad?: () => void;
  onWidgetError?: (error: any) => void;
}

declare global {
  interface Window {
    RazorpayAffordabilitySuite: any;
  }
}

const RazorpayAffordabilityWidget: React.FC<RazorpayAffordabilityWidgetProps> = ({
  amount,
  keyId,
  className = "",
  onWidgetLoad,
  onWidgetError,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const isWidgetRendered = useRef(false);

  useEffect(() => {
    const renderWidget = () => {
      if (
        typeof window !== "undefined" &&
        window.RazorpayAffordabilitySuite &&
        widgetRef.current &&
        !isWidgetRendered.current
      ) {
        try {
          // Clear any existing content
          if (widgetRef.current) {
            widgetRef.current.innerHTML = "";
          }

          const widgetConfig = {
            key: keyId,
            amount: amount,
          };

          const rzpAffordabilitySuite = new window.RazorpayAffordabilitySuite(widgetConfig);
          rzpAffordabilitySuite.render();
          
          isWidgetRendered.current = true;
          onWidgetLoad?.();
        } catch (error) {
          console.error("Error rendering Razorpay Affordability Widget:", error);
          onWidgetError?.(error);
        }
      }
    };

    // Try to render immediately if script is already loaded
    renderWidget();

    // Also try after a short delay to ensure script is fully loaded
    const timer = setTimeout(renderWidget, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [amount, keyId, onWidgetLoad, onWidgetError]);

  const handleScriptLoad = () => {
    // Script loaded, try to render widget
    setTimeout(() => {
      if (
        typeof window !== "undefined" &&
        window.RazorpayAffordabilitySuite &&
        widgetRef.current &&
        !isWidgetRendered.current
      ) {
        try {
          if (widgetRef.current) {
            widgetRef.current.innerHTML = "";
          }

          const widgetConfig = {
            key: keyId,
            amount: amount,
          };

          const rzpAffordabilitySuite = new window.RazorpayAffordabilitySuite(widgetConfig);
          rzpAffordabilitySuite.render();
          
          isWidgetRendered.current = true;
          onWidgetLoad?.();
        } catch (error) {
          console.error("Error rendering Razorpay Affordability Widget:", error);
          onWidgetError?.(error);
        }
      }
    }, 100);
  };

  const handleScriptError = (error: any) => {
    console.error("Error loading Razorpay Affordability Widget script:", error);
    onWidgetError?.(error);
  };

  return (
    <>
      <Script
        src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
      />
      <div
        ref={widgetRef}
        id="razorpay-affordability-widget"
        className={`razorpay-affordability-widget ${className}`}
        style={{ minHeight: "100px" }}
      />
    </>
  );
};

export default RazorpayAffordabilityWidget;
