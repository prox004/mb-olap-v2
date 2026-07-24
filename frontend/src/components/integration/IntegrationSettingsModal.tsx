import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function IntegrationSettingsModal() {
  const settingsModal = useModal();
  return (
    <>
      <button
        onClick={settingsModal.openModal}
        className="shadow-theme-xs inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5.64615 4.59906C5.05459 4.25752 4.29808 4.46015 3.95654 5.05171L2.69321 7.23986C2.35175 7.83128 2.5544 8.58754 3.14582 8.92899C3.97016 9.40493 3.97017 10.5948 3.14583 11.0707C2.55441 11.4122 2.35178 12.1684 2.69323 12.7598L3.95657 14.948C4.2981 15.5395 5.05461 15.7422 5.64617 15.4006C6.4706 14.9247 7.50129 15.5196 7.50129 16.4715C7.50129 17.1545 8.05496 17.7082 8.73794 17.7082H11.2649C11.9478 17.7082 12.5013 17.1545 12.5013 16.4717C12.5013 15.5201 13.5315 14.9251 14.3556 15.401C14.9469 15.7423 15.7029 15.5397 16.0443 14.9485L17.3079 12.7598C17.6494 12.1684 17.4467 11.4121 16.8553 11.0707C16.031 10.5948 16.031 9.40494 16.8554 8.92902C17.4468 8.58757 17.6494 7.83133 17.3079 7.23992L16.0443 5.05123C15.7029 4.45996 14.9469 4.25737 14.3556 4.59874C13.5315 5.07456 12.5013 4.47961 12.5013 3.52798C12.5013 2.84515 11.9477 2.2915 11.2649 2.2915L8.73795 2.2915C8.05496 2.2915 7.50129 2.84518 7.50129 3.52816C7.50129 4.48015 6.47059 5.07505 5.64615 4.59906Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.5714 9.99977C12.5714 11.4196 11.4204 12.5706 10.0005 12.5706C8.58069 12.5706 7.42969 11.4196 7.42969 9.99977C7.42969 8.57994 8.58069 7.42894 10.0005 7.42894C11.4204 7.42894 12.5714 8.57994 12.5714 9.99977Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Modal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.closeModal}
        className="relative w-full max-w-[558px] rounded-3xl m-5 sm:m-0 bg-white p-6 lg:p-10 dark:bg-gray-900"
      >
        <div>
          <h4 className="text-title-xs mb-1 font-semibold text-gray-800 dark:text-white/90">
            Integration settings
          </h4>
          <p className="mb-7 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Manage and configure your connected apps and services
          </p>
          <form action="#">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 disabled:opacity-50 dark:text-gray-400">
                  Select App
                </label>
                <div
                  x-data="{ isOptionSelected: false }"
                  className="relative z-20 bg-transparent"
                >
                  <select
                    disabled
                    className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  >
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Select Option
                    </option>
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Google Meet
                    </option>
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Mailchimp
                    </option>
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Zoom
                    </option>
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Loom
                    </option>
                    <option
                      defaultValue=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Gmail
                    </option>
                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                        stroke=""
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <Label>Client ID</Label>
                <Input
                  type="text"
                  defaultValue="872364219810-abc123xyz456.apps.googleusercontent.com"
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input
                  type="text"
                  defaultValue="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e"
                />
              </div>
              <div>
                <Label>Authentication base URI</Label>
                <Input
                  type="text"
                  defaultValue="https://accounts.application.com/o/oauth2/auth"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Save your changes by clicking ‘Save Changes’
            </p>
          </form>
          <div className="mt-8 flex w-full flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              onClick={settingsModal.closeModal}
              className="w-full"
              variant="outline"
            >
              Close
            </Button>
            <Button className="w-full">Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
