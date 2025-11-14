"use client";

import { useEffect } from "react";

interface NotificationProps {
  show: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  show,
  message,
  type = "error",
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const bgColor = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    info: "bg-blue-100 border-blue-400 text-blue-700",
  }[type];

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in"> {/* Changed top-4 to top-20 */}
      <div className={`${bgColor} border px-4 py-3 rounded relative shadow-lg`} role="alert">
        <strong className="font-bold capitalize">{type}: </strong>
        <span className="block sm:inline">{message}</span>
        <button
          className="absolute top-1 right-1 px-2 py-1" 
          onClick={onClose}
          aria-label="Close notification"
        >
          <svg
            className="fill-current h-4 w-4"
            role="button"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;