import React, { ReactNode, ButtonHTMLAttributes } from "react";

interface HoverButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function HoverButton({ children, ...rest }: HoverButtonProps) {
  return (
    <button
      {...rest}
      className="cursor-pointer relative overflow-hidden px-4 py-2 text-white text-lg font-semibold rounded-[12px] border-1 border-transparent transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white hover:shadow-lg active:scale-95"
      style={{ 
        backgroundColor: '#D3B750',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#D3B750';
        e.currentTarget.style.color = '#D3B750';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(211, 183, 80, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span className="relative z-20">{children}</span>
    </button>
  );
}

export default HoverButton;
