"use client";
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Image from "next/image";

export default function TaskHeader() {
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<string>("All");
  const { isOpen, openModal, closeModal } = useModal();
  const [message, setMessage] = useState("");

  const taskGroups = [
    { name: "All Tasks", key: "All", count: 14 },
    { name: "To do", key: "Todo", count: 3 },
    { name: "In Progress", key: "InProgress", count: 4 },
    { name: "Completed", key: "Completed", count: 4 },
  ];

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };
  return (
    <>
      <div className="flex flex-col items-center px-4 py-5 xl:px-6 xl:py-6">
        <div className="flex flex-col w-full gap-5 sm:justify-between xl:flex-row xl:items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {taskGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => setSelectedTaskGroup(group.key)}
                className={`inline-flex items-center xl:justify-start justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md group hover:text-gray-900 dark:hover:text-white ${
                  selectedTaskGroup === group.key
                    ? "text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {group.name}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal group-hover:bg-brand-50 group-hover:text-brand-500 dark:group-hover:bg-brand-500/15 dark:group-hover:text-brand-400 ${
                    selectedTaskGroup === group.key
                      ? "text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15"
                      : "bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  {group.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <Button variant="outline" size="sm">
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
                  d="M12.0826 4.0835C11.0769 4.0835 10.2617 4.89871 10.2617 5.90433C10.2617 6.90995 11.0769 7.72516 12.0826 7.72516C13.0882 7.72516 13.9034 6.90995 13.9034 5.90433C13.9034 4.89871 13.0882 4.0835 12.0826 4.0835ZM2.29004 6.65409H8.84671C9.18662 8.12703 10.5063 9.22516 12.0826 9.22516C13.6588 9.22516 14.9785 8.12703 15.3184 6.65409H17.7067C18.1209 6.65409 18.4567 6.31831 18.4567 5.90409C18.4567 5.48988 18.1209 5.15409 17.7067 5.15409H15.3183C14.9782 3.68139 13.6586 2.5835 12.0826 2.5835C10.5065 2.5835 9.18691 3.68139 8.84682 5.15409H2.29004C1.87583 5.15409 1.54004 5.48988 1.54004 5.90409C1.54004 6.31831 1.87583 6.65409 2.29004 6.65409ZM4.6816 13.3462H2.29085C1.87664 13.3462 1.54085 13.682 1.54085 14.0962C1.54085 14.5104 1.87664 14.8462 2.29085 14.8462H4.68172C5.02181 16.3189 6.34142 17.4168 7.91745 17.4168C9.49348 17.4168 10.8131 16.3189 11.1532 14.8462H17.7075C18.1217 14.8462 18.4575 14.5104 18.4575 14.0962C18.4575 13.682 18.1217 13.3462 17.7075 13.3462H11.1533C10.8134 11.8733 9.49366 10.7752 7.91745 10.7752C6.34124 10.7752 5.02151 11.8733 4.6816 13.3462ZM9.73828 14.096C9.73828 13.0904 8.92307 12.2752 7.91745 12.2752C6.91183 12.2752 6.09662 13.0904 6.09662 14.096C6.09662 15.1016 6.91183 15.9168 7.91745 15.9168C8.92307 15.9168 9.73828 15.1016 9.73828 14.096Z"
                  fill="currentColor"
                />
              </svg>
              Filter & Short
            </Button>
            <Button size="sm" onClick={openModal}>
              Add New Task
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
                  d="M9.2502 4.99951C9.2502 4.5853 9.58599 4.24951 10.0002 4.24951C10.4144 4.24951 10.7502 4.5853 10.7502 4.99951V9.24971H15.0006C15.4148 9.24971 15.7506 9.5855 15.7506 9.99971C15.7506 10.4139 15.4148 10.7497 15.0006 10.7497H10.7502V15.0001C10.7502 15.4143 10.4144 15.7501 10.0002 15.7501C9.58599 15.7501 9.2502 15.4143 9.2502 15.0001V10.7497H5C4.58579 10.7497 4.25 10.4139 4.25 9.99971C4.25 9.5855 4.58579 9.24971 5 9.24971H9.2502V4.99951Z"
                  fill=""
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-5 lg:p-10 m-4"
      >
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Add a new task
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Effortlessly manage your to-do list: add a new task
          </p>
        </div>

        <form className="flex flex-col">
          <div className="custom-scrollbar h-[350px] sm:h-[450px] overflow-y-auto px-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Task Title</Label>
                <Input type="text" />
              </div>

              <div>
                <Label>Due Date</Label>
                <div className="relative">
                  <Input type="date" placeholder="Select date" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <svg
                      className="fill-gray-700 dark:fill-gray-400"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4.33317 0.0830078C4.74738 0.0830078 5.08317 0.418794 5.08317 0.833008V1.24967H8.9165V0.833008C8.9165 0.418794 9.25229 0.0830078 9.6665 0.0830078C10.0807 0.0830078 10.4165 0.418794 10.4165 0.833008V1.24967L11.3332 1.24967C12.2997 1.24967 13.0832 2.03318 13.0832 2.99967V4.99967V11.6663C13.0832 12.6328 12.2997 13.4163 11.3332 13.4163H2.6665C1.70001 13.4163 0.916504 12.6328 0.916504 11.6663V4.99967V2.99967C0.916504 2.03318 1.70001 1.24967 2.6665 1.24967L3.58317 1.24967V0.833008C3.58317 0.418794 3.91896 0.0830078 4.33317 0.0830078ZM4.33317 2.74967H2.6665C2.52843 2.74967 2.4165 2.8616 2.4165 2.99967V4.24967H11.5832V2.99967C11.5832 2.8616 11.4712 2.74967 11.3332 2.74967H9.6665H4.33317ZM11.5832 5.74967H2.4165V11.6663C2.4165 11.8044 2.52843 11.9163 2.6665 11.9163H11.3332C11.4712 11.9163 11.5832 11.8044 11.5832 11.6663V5.74967Z"
                        fill=""
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      To Do
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      In Progress
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Completed
                    </option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
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
                <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tags
                </Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Marketing
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Template
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Development
                    </option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
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
                <Label>Assignees</Label>
                <div className="relative z-20 bg-transparent dark:bg-form-input">
                  <select className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Mayad Ahmed
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Juhan Ahamed
                    </option>
                    <option
                      value=""
                      className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                      Mahim Ahmed
                    </option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-4 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                        stroke=""
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label>Description</Label>
                <TextArea
                  placeholder="Type your message here..."
                  rows={6}
                  value={message}
                  onChange={handleMessageChange}
                />
              </div>
            </div>

            <div className="relative p-3 mt-6 border border-gray-200 rounded-xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <input type="file" id="upload-file" className="sr-only" />
              <div className="flex items-center gap-3 mb-5">
                <span className="text-lg font-medium text-gray-800 dark:text-white/90">
                  Attachments
                </span>
                <span className="block w-px h-4 bg-gray-200 dark:bg-gray-800"></span>
                <label
                  htmlFor="upload-file"
                  className="text-sm font-medium text-brand-500"
                >
                  Upload file
                </label>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <div className="group relative flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-5 dark:border-gray-800 dark:bg-white/5 sm:w-auto">
                  <span className="absolute flex items-center justify-center w-5 h-5 text-gray-400 bg-white border border-gray-200 rounded-full opacity-0 -right-2 -top-2 group-hover:opacity-100 dark:border-gray-800 dark:bg-gray-900">
                    <svg
                      className="fill-current"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.02145 8.2704C2.82618 8.46567 2.82618 8.78225 3.02145 8.97751C3.21671 9.17277 3.53329 9.17277 3.72855 8.97751L5.99935 6.70672L8.2704 8.97777C8.46567 9.17303 8.78225 9.17303 8.97751 8.97777C9.17277 8.78251 9.17277 8.46592 8.97751 8.27066L6.70646 5.99961L8.97751 3.72855C9.17277 3.53329 9.17277 3.21671 8.97751 3.02145C8.78225 2.82618 8.46567 2.82618 8.2704 3.02145L5.99935 5.2925L3.72855 3.02171C3.53329 2.82644 3.21671 2.82644 3.02145 3.02171C2.82618 3.21697 2.82618 3.53355 3.02145 3.72881L5.29224 5.99961L3.02145 8.2704Z"
                        fill=""
                      />
                    </svg>
                  </span>

                  <div className="w-full h-10 max-w-10">
                    <Image
                      width={40}
                      height={40}
                      src="/images/task/pdf.svg"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Guidelines.pdf
                    </p>
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        PDF
                      </span>
                      <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        Download
                      </span>
                    </span>
                  </div>
                </div>

                <div className="group relative flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-5 dark:border-gray-800 dark:bg-white/5 sm:w-auto">
                  <span className="absolute flex items-center justify-center w-5 h-5 text-gray-400 bg-white border border-gray-200 rounded-full opacity-0 -right-2 -top-2 group-hover:opacity-100 dark:border-gray-800 dark:bg-gray-900">
                    <svg
                      className="fill-current"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.02145 8.2704C2.82618 8.46567 2.82618 8.78225 3.02145 8.97751C3.21671 9.17277 3.53329 9.17277 3.72855 8.97751L5.99935 6.70672L8.2704 8.97777C8.46567 9.17303 8.78225 9.17303 8.97751 8.97777C9.17277 8.78251 9.17277 8.46592 8.97751 8.27066L6.70646 5.99961L8.97751 3.72855C9.17277 3.53329 9.17277 3.21671 8.97751 3.02145C8.78225 2.82618 8.46567 2.82618 8.2704 3.02145L5.99935 5.2925L3.72855 3.02171C3.53329 2.82644 3.21671 2.82644 3.02145 3.02171C2.82618 3.21697 2.82618 3.53355 3.02145 3.72881L5.29224 5.99961L3.02145 8.2704Z"
                        fill=""
                      />
                    </svg>
                  </span>

                  <div className="w-full h-10 max-w-10">
                    <Image
                      width={40}
                      height={40}
                      src="/images/task/google-drive.svg"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Branding Assets
                    </p>
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        Media
                      </span>
                      <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        Download
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex h-[60px] w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400 sm:w-[60px]">
                  <svg
                    className="fill-current"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.2502 5.99951C11.2502 5.5853 11.586 5.24951 12.0002 5.24951C12.4145 5.24951 12.7502 5.5853 12.7502 5.99951V11.2498H18.0007C18.4149 11.2498 18.7507 11.5855 18.7507 11.9998C18.7507 12.414 18.4149 12.7498 18.0007 12.7498H12.7502V18.0002C12.7502 18.4144 12.4145 18.7502 12.0002 18.7502C11.586 18.7502 11.2502 18.4144 11.2502 18.0002V12.7498H6C5.58579 12.7498 5.25 12.414 5.25 11.9998C5.25 11.5855 5.58579 11.2498 6 11.2498H11.2502V5.99951Z"
                      fill=""
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 px-2 mt-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Viewers:
              </p>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 overflow-hidden border border-white rounded-full dark:border-gray-900">
                  <Image
                    width={40}
                    height={40}
                    src="/images/user/user-13.jpg"
                    alt="user"
                  />
                </div>
                <div className="w-8 h-8 overflow-hidden border border-white rounded-full dark:border-gray-900">
                  <Image
                    width={40}
                    height={40}
                    src="/images/user/user-14.jpg"
                    alt="user"
                  />
                </div>
                <div className="w-8 h-8 overflow-hidden border border-white rounded-full dark:border-gray-900">
                  <Image
                    width={40}
                    height={40}
                    src="/images/user/user-15.jpg"
                    alt="user"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center w-full gap-3 sm:w-auto">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                Create Task
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
