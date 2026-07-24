"use client";
import { useState } from "react";

// Copy Button Component
interface CopyButtonProps {
  textToCopy: string;
}

function CopyButton({ textToCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-8 items-center gap-1 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-500 dark:border-white/5 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white/90"
    >
      {!copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M14.1567 14.1628H7.08803C6.39768 14.1628 5.83803 13.6031 5.83803 12.9128V5.8441M14.1567 14.1628L14.1567 15.416C14.1567 16.1064 13.5971 16.666 12.9067 16.666H4.58478C3.89442 16.666 3.33478 16.1064 3.33478 15.416V7.0941C3.33478 6.40374 3.89442 5.8441 4.58478 5.8441H5.83803M14.1567 14.1628H15.4152C16.1056 14.1628 16.6652 13.6031 16.6652 12.9128L16.6652 4.58392C16.6652 3.89357 16.1056 3.33392 15.4152 3.33392H7.08803C6.39768 3.33392 5.83803 3.89357 5.83803 4.58392V5.8441"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M16.6663 5L7.49967 14.1667L3.33301 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function TextGeneratorContent() {
  // Sample chat data
  const firstResponse =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et varius tortor. Aenean dui magna, vehicula in lacinia non, euismod sed odio. Aliquam erat volutpat. Integer iaculis eu tellus vel tincidunt. Sed sed dictum orci, in pretium erat. Proin ut mi a arcu mollis hendrerit. Ut id est finibus, egestas tellus ac, pharetra ante.";

  const secondResponse =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et varius tortor. Aenean dui magna, vehicula in lacinia non, euismod sed odio. Aliquam erat volutpat. Integer iaculis eu tellus vel tincidunt. Sed sed dictum orci, in pretium erat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et varius tortor.";

  return (
    <div className="custom-scrollbar relative z-20 max-h-[50vh] flex-1 mx-auto space-y-7 w-full overflow-y-auto pb-10 lg:pb-7">
      {/* <!-- User Message --> */}
      <div className="flex justify-end">
        <div className="shadow-theme-xs bg-brand-100 dark:bg-brand-500/20 max-w-[480px] rounded-xl rounded-tr-xs px-4 py-3">
          <p className="text-left text-sm font-normal text-gray-800 dark:text-white/90">
            Can you generate some random, creative, and engaging placeholder
            text for me? It doesn&apos;t need to follow any specific
            structure—just something fun or interesting to fill space
            temporarily.
          </p>
        </div>
      </div>

      {/* <!-- AI Response --> */}
      <div className="flex justify-start">
        <div>
          <div className="shadow-theme-xs max-w-[480px] rounded-xl rounded-tl-xs bg-gray-100 px-4 py-3 dark:bg-white/5">
            <p className="mb-5 text-sm leading-5 text-gray-800 dark:text-white/90">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              et varius tortor. Aenean dui magna, vehicula in lacinia non,
              euismod sed odio. Aliquam erat volutpat.
            </p>
            <p className="mb-5 text-sm leading-5 text-gray-800 dark:text-white/90">
              Integer iaculis eu tellus vel tincidunt. Sed sed dictum orci, in
              pretium erat. Proin ut mi a arcu mollis hendrerit. Ut id est
              finibus, egestas tellus ac, pharetra ante.
            </p>
          </div>
          <div className="mt-3">
            <CopyButton textToCopy={firstResponse} />
          </div>
        </div>
      </div>

      {/* <!-- User Message --> */}
      <div className="flex justify-end">
        <div className="shadow-theme-xs bg-brand-100 dark:bg-brand-500/20 max-w-[480px] rounded-xl rounded-tr-xs px-4 py-3">
          <p className="text-left text-sm font-normal text-gray-800 dark:text-white/90">
            I&apos;m looking for a block of random, imaginative text—something
            quirky or unexpected to use as placeholder content.
          </p>
        </div>
      </div>

      {/* <!-- AI Response --> */}
      <div className="flex justify-start">
        <div>
          <div className="shadow-theme-xs max-w-[480px] rounded-xl rounded-tl-xs bg-gray-100 px-4 py-3 dark:bg-white/5">
            <p className="mb-5 text-sm leading-5 text-gray-800 dark:text-white/90">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              et varius tortor. Aenean dui magna, vehicula in lacinia non,
              euismod sed odio. Aliquam erat volutpat. Integer iaculis eu tellus
              vel tincidunt. Sed sed dictum orci, in pretium erat.
            </p>
            <p className="mb-5 text-sm leading-5 text-gray-800 dark:text-white/90">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              et varius tortor.
            </p>
          </div>
          <div className="mt-3">
            <CopyButton textToCopy={secondResponse} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export CopyButton for reuse in other components
export { CopyButton };
