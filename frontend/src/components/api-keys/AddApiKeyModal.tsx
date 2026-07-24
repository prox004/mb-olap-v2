"use client";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Label from "../form/Label";
import Input from "../form/input/InputField";

export default function AddApiKeyModal() {
  const addApiKeyModal = useModal();
  return (
    <>
      <Button onClick={addApiKeyModal.openModal}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 10.0002H15.0006M10.0002 5V15.0006"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        Add API Key
      </Button>
      <Modal
        isOpen={addApiKeyModal.isOpen}
        onClose={addApiKeyModal.closeModal}
        className="relative w-full max-w-[600px] m-5 sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
      >
        <div>
          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Generate API key
          </h4>
          <p className="mb-7 text-sm leading-6 text-gray-500 dark:text-gray-400">
            To enable secure access to the web services, your app requires an
            API key with permissions for resources such as the S3 bucket.
          </p>
          <form action="#">
            <div>
              <Label>Enter your application name</Label>
              <Input type="text" defaultValue="Saasbold" />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Naming your application makes it easier to recognize your API key
              in the future.
            </p>
          </form>
          <div className="mt-8 flex w-full flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={addApiKeyModal.closeModal}
            >
              Close
            </Button>
            <Button className="w-full" onClick={addApiKeyModal.closeModal}>
              Generate API key
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
