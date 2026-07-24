"use client";
import React, { useState } from "react";
import Checkbox from "../../form/input/Checkbox";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

interface EmailHeaderProps {
  isChecked: boolean;
  onSelectAll: (checked: boolean) => void;
}

export default function EmailHeader({
  isChecked,
  onSelectAll,
}: EmailHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const [isOpenTwo, setIsOpenTwo] = useState(false);

  function toggleDropdownTwo() {
    setIsOpenTwo(!isOpenTwo);
  }

  function closeDropdownTwo() {
    setIsOpenTwo(false);
  }

  return (
    <div className="flex flex-col justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row">
      <div className="flex items-center w-full gap-2">
        <div className="relative w-full sm:w-auto">
          <button className="flex items-center dropdown-toggle justify-between w-full gap-3 p-3 border border-gray-200 rounded-lg dark:border-gray-800 sm:justify-center">
            <Checkbox checked={isChecked} onChange={onSelectAll} />
            <span
              onClick={toggleDropdown}
              className={`${
                isOpen ? "rotate-180" : ""
              } text-gray-500 duration-300 dropdown-toggle ease-linear dark:text-gray-40`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.83325 5.91699L7.99992 10.0837L12.1666 5.91699"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="absolute left-0 z-40 w-40 p-2 mt-1 space-y-1 bg-white border border-gray-200 top-full rounded-2xl shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full px-3 py-2 font-medium text-left text-gray-500 rounded-lg text-theme-xs hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              All
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full px-3 py-2 font-medium text-left text-gray-500 rounded-lg text-theme-xs hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Read
            </DropdownItem>{" "}
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full px-3 py-2 font-medium text-left text-gray-500 rounded-lg text-theme-xs hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Unread
            </DropdownItem>
          </Dropdown>
        </div>

        <button className="flex items-center justify-center w-full h-10 text-gray-500 transition-colors border border-gray-200 rounded-lg max-w-10 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.72763 4.33443C7.92401 3.6437 9.30836 3.34945 10.6823 3.49385C12.0562 3.63826 13.3491 4.2139 14.3757 5.13828C15.0468 5.74252 15.5815 6.4755 15.9517 7.28815L13.6069 6.49282C13.2147 6.35977 12.7888 6.5699 12.6557 6.96216C12.5227 7.35443 12.7328 7.78028 13.1251 7.91333L16.8227 9.16752C16.8668 9.18743 16.9129 9.20314 16.9605 9.21426L17.0868 9.25712C17.2752 9.32101 17.4813 9.30746 17.6597 9.21943C17.838 9.1314 17.9741 8.97611 18.038 8.78772L19.3816 4.82561C19.5147 4.43334 19.3045 4.0075 18.9122 3.87447C18.52 3.74145 18.0941 3.95161 17.9611 4.34388L17.2335 6.48938C16.783 5.5609 16.1553 4.72223 15.3794 4.02356C14.1174 2.88722 12.528 2.17958 10.839 2.00207C9.15012 1.82455 7.44834 2.18628 5.97763 3.03539C4.50692 3.88451 3.34277 5.17743 2.65203 6.72884C1.9613 8.28025 1.77944 10.0105 2.13252 11.6716C2.4856 13.3328 3.3555 14.8395 4.61753 15.9758C5.87957 17.1121 7.46894 17.8198 9.15788 17.9973C10.8468 18.1748 12.5486 17.8131 14.0193 16.964C14.378 16.7569 14.5009 16.2982 14.2938 15.9395C14.0867 15.5807 13.628 15.4578 13.2693 15.6649C12.0729 16.3557 10.6886 16.6499 9.31467 16.5055C7.94077 16.3611 6.64786 15.7855 5.62123 14.8611C4.5946 13.9367 3.88697 12.711 3.59974 11.3598C3.31252 10.0085 3.46046 8.60098 4.02235 7.33894C4.58424 6.07691 5.53125 5.02516 6.72763 4.33443Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button className="flex items-center justify-center w-full h-10 text-gray-500 transition-colors border border-gray-200 rounded-lg max-w-10 hover:bg-gray-100 hover:text-error-500 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-error-500">
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.54118 3.7915C6.54118 2.54886 7.54854 1.5415 8.79118 1.5415H11.2078C12.4505 1.5415 13.4578 2.54886 13.4578 3.7915V4.0415H15.6249H16.6658C17.08 4.0415 17.4158 4.37729 17.4158 4.7915C17.4158 5.20572 17.08 5.5415 16.6658 5.5415H16.3749V8.24638V13.2464V16.2082C16.3749 17.4508 15.3676 18.4582 14.1249 18.4582H5.87492C4.63228 18.4582 3.62492 17.4508 3.62492 16.2082V13.2464V8.24638V5.5415H3.33325C2.91904 5.5415 2.58325 5.20572 2.58325 4.7915C2.58325 4.37729 2.91904 4.0415 3.33325 4.0415H4.37492H6.54118V3.7915ZM14.8749 13.2464V8.24638V5.5415H13.4578H12.7078H7.29118H6.54118H5.12492V8.24638V13.2464V16.2082C5.12492 16.6224 5.46071 16.9582 5.87492 16.9582H14.1249C14.5391 16.9582 14.8749 16.6224 14.8749 16.2082V13.2464ZM8.04118 4.0415H11.9578V3.7915C11.9578 3.37729 11.6221 3.0415 11.2078 3.0415H8.79118C8.37696 3.0415 8.04118 3.37729 8.04118 3.7915V4.0415ZM8.33325 7.99984C8.74747 7.99984 9.08325 8.33562 9.08325 8.74984V13.7498C9.08325 14.1641 8.74747 14.4998 8.33325 14.4998C7.91904 14.4998 7.58325 14.1641 7.58325 13.7498V8.74984C7.58325 8.33562 7.91904 7.99984 8.33325 7.99984ZM12.4166 8.74984C12.4166 8.33562 12.0808 7.99984 11.6666 7.99984C11.2524 7.99984 10.9166 8.33562 10.9166 8.74984V13.7498C10.9166 14.1641 11.2524 14.4998 11.6666 14.4998C12.0808 14.4998 12.4166 14.1641 12.4166 13.7498V8.74984Z"
              fill=""
            />
          </svg>
        </button>

        <button className="flex items-center justify-center w-full h-10 text-gray-500 border border-gray-200 rounded-lg max-w-10 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.54163 4.8335C1.54163 3.59085 2.54899 2.5835 3.79163 2.5835H16.2083C17.4509 2.5835 18.4583 3.59085 18.4583 4.8335V5.16683C18.4583 5.96477 18.0429 6.66569 17.4166 7.06517V15.1668C17.4166 16.4095 16.4093 17.4168 15.1666 17.4168H4.83329C3.59065 17.4168 2.58329 16.4095 2.58329 15.1668V7.06517C1.95699 6.66568 1.54163 5.96476 1.54163 5.16683V4.8335ZM4.08329 7.41683H15.9166V15.1668C15.9166 15.581 15.5808 15.9168 15.1666 15.9168H4.83329C4.41908 15.9168 4.08329 15.581 4.08329 15.1668V7.41683ZM16.9583 5.16683C16.9583 5.58104 16.6225 5.91683 16.2083 5.91683H3.79163C3.37741 5.91683 3.04163 5.58104 3.04163 5.16683V4.8335C3.04163 4.41928 3.37741 4.0835 3.79163 4.0835H16.2083C16.6225 4.0835 16.9583 4.41928 16.9583 4.8335V5.16683ZM8.33329 9.04183C7.91908 9.04183 7.58329 9.37762 7.58329 9.79183C7.58329 10.206 7.91908 10.5418 8.33329 10.5418H11.6666C12.0808 10.5418 12.4166 10.206 12.4166 9.79183C12.4166 9.37762 12.0808 9.04183 11.6666 9.04183H8.33329Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div className="relative inline-block">
          <button
            onClick={toggleDropdownTwo}
            className="flex items-center w-10 dropdown-toggle text-gray-500 justify-center  h-10 transition-colors border border-gray-200 rounded-lg max-w-10 dark:text-gray-400 hover:bg-gray-100 dark:border-white/[0.05] dark:hover:bg-gray-800"
          >
            <MoreDotIcon className="text-gray-400 dropdown-toggle  hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpenTwo}
            onClose={closeDropdownTwo}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdownTwo}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdownTwo}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className=" w-full sm:max-w-[236px]">
        <form>
          <div className="relative">
            <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
              <svg
                className="fill-gray-500 dark:fill-gray-400"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z"
                  fill=""
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-[42px] text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
