"use client";
import { ReactNode, useState } from "react";
import { HorizontaLDots } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import IntegrationDetailsModal from "./IntegrationDetailsModal";
import { useModal } from "../../hooks/useModal";
import IntegrationDeleteModal from "./IntegrationDeleteModal";
import Switch from "../form/switch/Switch";
import IntegrationSettingsModal from "./IntegrationSettingsModal";

interface IntegrationCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  connect: boolean;
}

export default function IntegrationCard({
  title,
  icon,
  description,
  connect,
}: IntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const deleteModal = useModal();

  return (
    <>
      <article className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="relative p-5 pb-9">
          <div className="mb-5 inline-flex h-10 w-10 items-center justify-center">
            {icon}
          </div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
          <div className="absolute top-5 right-5 h-fit">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <HorizontaLDots className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={deleteModal.openModal}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Remove
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 p-5 dark:border-gray-800">
          <div className="flex gap-3">
            <IntegrationSettingsModal />
            <IntegrationDetailsModal />
          </div>
          <Switch defaultChecked={connect} />
        </div>
      </article>
      <IntegrationDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
      />
    </>
  );
}
