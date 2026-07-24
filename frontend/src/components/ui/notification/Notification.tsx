"use client";
import React, { useState } from "react";
import {
  AlertIcon,
  CheckCircleIcon,
  CloseIcon,
  ErrorIcon,
  InfoIcon,
} from "../../../icons";

interface NotificationProps {
  variant: "success" | "info" | "warning" | "error"; // Notification type
  title: string; // Title text
  description?: string; // Optional description
  hideDuration?: number; // Time in milliseconds to hide the notification (default: 5000ms)
}

const Notification: React.FC<NotificationProps> = ({
  variant,
  title,
  description,
  hideDuration = 3000, // Default hide duration: 5 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Styling configuration for each alert type
  const variantStyles = {
    success: {
      borderColor: "border-success-500",
      iconBg: "bg-success-50 text-success-500",
      icon: <CheckCircleIcon />,
    },
    info: {
      borderColor: "border-blue-light-500",
      iconBg: "bg-blue-light-50 text-blue-light-500",
      icon: <InfoIcon />,
    },
    warning: {
      borderColor: "border-warning-500",
      iconBg: "bg-warning-50 text-warning-500",
      icon: <AlertIcon />,
    },
    error: {
      borderColor: "border-error-500",
      iconBg: "bg-error-50 text-error-500",
      icon: <ErrorIcon />,
    },
  };

  const { borderColor, iconBg, icon } = variantStyles[variant];

  const handleClose = () => {
    // Hide the notification
    setIsVisible(false);

    // Show it again after the specified time
    setTimeout(() => {
      setIsVisible(true);
    }, hideDuration);
  };

  if (!isVisible) return null; // Don't render anything if not visible

  return (
    <div
      className={`flex items-center justify-between gap-3 w-full sm:max-w-[340px] rounded-md border-b-4 p-3 shadow-theme-sm dark:bg-[#1E2634] ${borderColor}`}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}
        >
          {icon}
        </div>

        {/* Title and Description */}
        <div>
          <h4 className="text-sm text-gray-800 sm:text-base dark:text-white/90">
            {title}
          </h4>
          {description && (
            <p className="mt-1 text-xs text-gray-600 sm:text-sm dark:text-white/70">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-800 dark:hover:text-white/90"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default Notification;
