import Image from "next/image";
import React from "react";

export default function ImageGeneratorContent() {
  return (
    <div className="custom-scrollbar relative z-20 max-h-[50vh] space-y-7 overflow-y-auto pb-7">
      {/* <!-- User Message --> */}
      <div className="flex justify-end">
        <div className="shadow-theme-xs bg-brand-100 dark:bg-brand-500/20 max-w-[480px] rounded-xl rounded-tr-xs px-4 py-3">
          <p className="text-left text-sm font-normal text-gray-800 dark:text-white/90">
            Generate 2 abstract image with purple and pink color
          </p>
        </div>
      </div>

      {/* <!-- AI Response --> */}
      <div className="mb-6 flex justify-start">
        <div className="max-w-3xl">
          <div className="relative rounded-xl">
            <Image
              width={714}
              height={285}
              src="/images/ai/img-lg.png"
              className="w-full rounded-xl"
              alt=""
            />
          </div>
          <div className="mt-3">
            <button className="flex h-8 items-center gap-1 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M16.6671 13.3333V15.4166C16.6671 16.107 16.1074 16.6666 15.4171 16.6666H4.58301C3.89265 16.6666 3.33301 16.107 3.33301 15.4166V13.3333M10.0013 13.3333L10.0013 3.33331M6.14553 9.47948L9.99958 13.3311L13.8539 9.47948"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download
            </button>
            <p className="mt-3 text-sm leading-5 text-gray-500 dark:text-gray-400">
              Here is the tall building with a sleek glass facade, as described.
              The structure features modern elements with reflective glass
              panels that shimmer beautifully under the sunlight.
            </p>
          </div>
        </div>
      </div>

      {/* <!-- User Message --> */}
      <div className="flex justify-end">
        <div className="shadow-theme-xs bg-brand-100 dark:bg-brand-500/20 max-w-[480px] rounded-xl rounded-tr-xs px-4 py-3">
          <p className="text-left text-sm font-normal text-gray-800 dark:text-white/90">
            Generate a tall building image with glass
          </p>
        </div>
      </div>

      {/* <!-- AI Response --> */}
      <div className="mb-6 flex justify-start">
        <div className="max-w-3xl">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="relative">
              <Image
                width={350}
                height={286}
                src="/images/ai/img-md-1.png"
                className="w-full rounded-xl"
                alt=""
              />
              <button className="mt-3 flex h-8 items-center gap-1 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.6671 13.3333V15.4166C16.6671 16.107 16.1074 16.6666 15.4171 16.6666H4.58301C3.89265 16.6666 3.33301 16.107 3.33301 15.4166V13.3333M10.0013 13.3333L10.0013 3.33331M6.14553 9.47948L9.99958 13.3311L13.8539 9.47948"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download
              </button>
            </div>
            <div className="relative">
              <Image
                width={350}
                height={286}
                src="/images/ai/img-md-2.png"
                className="w-full rounded-xl"
                alt=""
              />
              <button className="mt-3 flex h-8 items-center gap-1 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.6671 13.3333V15.4166C16.6671 16.107 16.1074 16.6666 15.4171 16.6666H4.58301C3.89265 16.6666 3.33301 16.107 3.33301 15.4166V13.3333M10.0013 13.3333L10.0013 3.33331M6.14553 9.47948L9.99958 13.3311L13.8539 9.47948"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
          <div className="mt-3">
            <p className="mt-3 text-sm leading-5 text-gray-500 dark:text-gray-400">
              Here are two tall buildings with sleek glass facades, just as
              described. Both structures showcase modern design elements, glass
              panels that shimmer beautifully in the sunlight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
