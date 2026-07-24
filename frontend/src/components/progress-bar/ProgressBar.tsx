import React from "react";

type ProgressBarProps = {
  progress: number;
  size?: "sm" | "md" | "lg" | "xl";
  label?: "none" | "outside" | "inside";
  className?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = "sm",
  label = "none",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-5",
  };

  const baseClasses =
    "relative w-full bg-gray-200 rounded-full dark:bg-gray-800";
  const progressClasses = "absolute left-0 h-full bg-brand-500 rounded-full";

  const renderLabel = () => {
    if (label === "outside") {
      return (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-400">
          {progress}%
        </span>
      );
    } else if (label === "inside") {
      return (
        <span className="absolute inset-0 flex items-center justify-center text-white font-medium text-[10px] leading-tight">
          {progress}%
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${baseClasses} ${sizeClasses[size]}`}>
        <div
          className={`${progressClasses} ${
            label === "inside" ? "flex items-center justify-center" : ""
          }`}
          style={{ width: `${progress}%` }}
        >
          {label === "inside" && renderLabel()}
        </div>
      </div>
      {label === "outside" && renderLabel()}
    </div>
  );
};

export default ProgressBar;
