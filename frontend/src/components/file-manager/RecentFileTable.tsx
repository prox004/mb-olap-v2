import React from "react";

import { ArrowRightIcon } from "../../icons";
import Link from "next/link";
import Image from "next/image";

const tableData = [
  {
    fileName: "Video_947954.mp4",
    fileIcon: {
      light: "/images/icons/file-video.svg",
      dark: "/images/icons/file-video-dark.svg",
    },
    category: "Video",
    size: "89 MB",
    dateModified: "12 Jan, 2027",
  },
  {
    fileName: "Travel.jpg",
    fileIcon: {
      light: "/images/icons/file-image.svg",
      dark: "/images/icons/file-image-dark.svg",
    },
    category: "Image",
    size: "5.4 MB",
    dateModified: "10 Feb, 2027",
  },
  {
    fileName: "Document.pdf",
    fileIcon: {
      light: "/images/icons/file-pdf.svg",
      dark: "/images/icons/file-pdf-dark.svg",
    },
    category: "Document",
    size: "1.2 MB",
    dateModified: "8 Mar, 2027",
  },
  {
    fileName: "Video_947954_028.mp4",
    fileIcon: {
      light: "/images/icons/file-video.svg",
      dark: "/images/icons/file-video-dark.svg",
    },
    category: "Video",
    size: "489 MB",
    dateModified: "29 Apr, 2027",
  },
  {
    fileName: "Mountain.png",
    fileIcon: {
      light: "/images/icons/file-image.svg",
      dark: "/images/icons/file-image-dark.svg",
    },
    category: "Image",
    size: "5.4 MB",
    dateModified: "10 Feb, 2027",
  },
  {
    fileName: "CV.pdf",
    fileIcon: {
      light: "/images/icons/file-pdf.svg",
      dark: "/images/icons/file-pdf-dark.svg",
    },
    category: "Document",
    size: "12 MB",
    dateModified: "17 Jun, 2027",
  },
  {
    fileName: "Video_09783_882943.mp4",
    fileIcon: {
      light: "/images/icons/file-video.svg",
      dark: "/images/icons/file-video-dark.svg",
    },
    category: "Video",
    size: "309 MB",
    dateModified: "27 Jul, 2027",
  },
];

export default function RecentFileTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between px-6 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Files
          </h3>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500"
        >
          View All
          <ArrowRightIcon />
        </Link>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          {/* Table Header */}
          <thead>
            <tr className="border-t border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                File Name
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Category
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Size
              </th>
              <th className="px-6 py-3 font-medium text-left text-gray-500 text-theme-sm dark:text-gray-400">
                Date Modified
              </th>
              <th className="px-6 py-3 font-medium text-center text-gray-500 text-theme-sm dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {tableData.map((row, index) => (
              <tr
                key={index}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-6 py-[18px] text-sm text-gray-700 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Image
                      width={20}
                      height={20}
                      src={row.fileIcon.light}
                      alt="icon"
                      className="dark:hidden"
                    />
                    <Image
                      width={20}
                      height={20}
                      src={row.fileIcon.dark}
                      alt="icon"
                      className="hidden dark:block"
                    />
                    {row.fileName}
                  </div>
                </td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                  {row.category}
                </td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                  {row.size}
                </td>
                <td className="px-6 py-[18px] text-gray-700 text-theme-sm dark:text-gray-400">
                  {row.dateModified}
                </td>
                <td className="px-6 py-[18px] text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500">
                      <svg
                        className="fill-current"
                        width="21"
                        height="20"
                        viewBox="0 0 21 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.4163 3.79199C7.4163 2.54935 8.42366 1.54199 9.6663 1.54199H12.083C13.3256 1.54199 14.333 2.54935 14.333 3.79199V4.04199H16.5H17.5409C17.9551 4.04199 18.2909 4.37778 18.2909 4.79199C18.2909 5.20621 17.9551 5.54199 17.5409 5.54199H17.25V8.24687V13.2469V16.2087C17.25 17.4513 16.2427 18.4587 15 18.4587H6.75004C5.5074 18.4587 4.50004 17.4513 4.50004 16.2087V13.2469V8.24687V5.54199H4.20837C3.79416 5.54199 3.45837 5.20621 3.45837 4.79199C3.45837 4.37778 3.79416 4.04199 4.20837 4.04199H5.25004H7.4163V3.79199ZM15.75 13.2469V8.24687V5.54199H14.333H13.583H8.1663H7.4163H6.00004V8.24687V13.2469V16.2087C6.00004 16.6229 6.33583 16.9587 6.75004 16.9587H15C15.4143 16.9587 15.75 16.6229 15.75 16.2087V13.2469ZM8.9163 4.04199H12.833V3.79199C12.833 3.37778 12.4972 3.04199 12.083 3.04199H9.6663C9.25209 3.04199 8.9163 3.37778 8.9163 3.79199V4.04199ZM9.20837 8.00033C9.62259 8.00033 9.95837 8.33611 9.95837 8.75033V13.7503C9.95837 14.1645 9.62259 14.5003 9.20837 14.5003C8.79416 14.5003 8.45837 14.1645 8.45837 13.7503V8.75033C8.45837 8.33611 8.79416 8.00033 9.20837 8.00033ZM13.2917 8.75033C13.2917 8.33611 12.9559 8.00033 12.5417 8.00033C12.1275 8.00033 11.7917 8.33611 11.7917 8.75033V13.7503C11.7917 14.1645 12.1275 14.5003 12.5417 14.5003C12.9559 14.5003 13.2917 14.1645 13.2917 13.7503V8.75033Z"
                          fill=""
                        />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                      <svg
                        className="fill-current"
                        width="21"
                        height="20"
                        viewBox="0 0 21 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.8749 13.8619C8.10837 13.8619 5.74279 12.1372 4.79804 9.70241C5.74279 7.26761 8.10837 5.54297 10.8749 5.54297C13.6415 5.54297 16.0071 7.26762 16.9518 9.70243C16.0071 12.1372 13.6415 13.8619 10.8749 13.8619ZM10.8749 4.04297C7.35666 4.04297 4.36964 6.30917 3.29025 9.4593C3.23626 9.61687 3.23626 9.78794 3.29025 9.94552C4.36964 13.0957 7.35666 15.3619 10.8749 15.3619C14.3932 15.3619 17.3802 13.0957 18.4596 9.94555C18.5136 9.78797 18.5136 9.6169 18.4596 9.45932C17.3802 6.30919 14.3932 4.04297 10.8749 4.04297ZM10.8663 7.84413C9.84002 7.84413 9.00808 8.67606 9.00808 9.70231C9.00808 10.7286 9.84002 11.5605 10.8663 11.5605H10.8811C11.9074 11.5605 12.7393 10.7286 12.7393 9.70231C12.7393 8.67606 11.9074 7.84413 10.8811 7.84413H10.8663Z"
                          fill=""
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
