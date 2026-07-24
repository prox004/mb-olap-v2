import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";

export default function IntegrationDetailsModal() {
  const detailsModal = useModal();
  return (
    <>
      <button
        onClick={detailsModal.openModal}
        className="shadow-theme-xs inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-400"
      >
        Details
      </button>

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.closeModal}
        className=" relative w-full max-w-[558px] m-5 sm:m-0 rounded-3xl bg-white p-6 overflow-hidden lg:p-10 dark:bg-gray-900"
      >
        <div>
          <h4 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
            Integration details
          </h4>
          <p className="mb-7 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Check the credentials and settings for your connected app.
          </p>
          <ul>
            <li className="flex justify-between border-b border-gray-100 py-2.5 dark:border-gray-800">
              <span className="w-1/2 text-sm text-gray-500 dark:text-gray-400">
                App Name
              </span>
              <span className="w-1/2 break-words text-gray-700 dark:text-gray-400">
                Example App
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-100 py-2.5 dark:border-gray-800">
              <span className="w-1/2 text-sm text-gray-500 dark:text-gray-400">
                Client ID
              </span>
              <span className="w-1/2 break-words text-gray-700 dark:text-gray-400">
                872364219810-abc123xyz456.apps.usercontent.com
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-100 py-2.5 dark:border-gray-800">
              <span className="w-1/2 text-sm text-gray-500 dark:text-gray-400">
                Client Secret
              </span>
              <span className="w-1/2 break-words text-gray-700 dark:text-gray-400">
                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e
              </span>
            </li>
            <li className="flex justify-between border-b border-gray-100 py-2.5 dark:border-gray-800">
              <span className="w-1/2 text-sm text-gray-500 dark:text-gray-400">
                Authentication base URI
              </span>
              <span className="w-1/2 break-words text-gray-700 dark:text-gray-400">
                https://accounts.app.com/o/oauth2/auth
              </span>
            </li>
          </ul>
        </div>
      </Modal>
    </>
  );
}
