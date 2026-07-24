"use client";
import { BoltIcon } from "../../../icons";

interface UpdateNotificationProps {
  title: string; // Title of the notification
  message: string; // Message description
  onLaterClick?: () => void; // Callback for the 'Later' button
  onUpdateClick?: () => void; // Callback for the 'Update Now' button
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  title,
  message,
  onLaterClick,
  onUpdateClick,
}) => {
  return (
    <div className="w-full max-w-[607px] rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1E2634]">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-brand-500">
          <BoltIcon />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div>
            <h5 className="mb-1 text-base font-medium text-gray-800 dark:text-white/90">
              {title}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center w-full gap-3 sm:max-w-fit">
            <button
              type="button"
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              onClick={onLaterClick}
            >
              Later
            </button>
            <button
              type="button"
              className="flex justify-center px-4 py-3 text-sm font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              onClick={onUpdateClick}
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
