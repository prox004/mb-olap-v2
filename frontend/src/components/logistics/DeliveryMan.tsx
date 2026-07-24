import Image from "next/image";

export default function DeliveryMan() {
  return (
    <div className="flex justify-between rounded-xl bg-white p-2 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div>
          <Image
            width={48}
            height={48}
            src="/images/logistics/avatar-1.png"
            className="h-12 w-12 rounded-full"
            alt=""
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Courier</p>
          <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">
            Devid walthen
          </h3>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M7.99967 15.3714C12.0267 15.3714 15.2913 12.1068 15.2913 8.07975C15.2913 4.05268 12.0267 0.788086 7.99967 0.788086C3.9726 0.788086 0.708008 4.05268 0.708008 8.07975C0.708008 10.0933 1.52416 11.9162 2.84369 13.2357L0.708008 15.3714H7.99967Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.35449 8.08057H4.36283M8.00033 8.08057H8.00866M11.6462 8.08057H11.6545"
              stroke="#344054"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[0.5px] border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M10.1201 15.5908C11.5913 16.4194 13.1728 16.9798 14.7931 17.2718C15.2176 17.3484 15.6482 17.1989 15.9532 16.8939L16.8434 16.0038C17.598 15.2491 17.3666 13.973 16.395 13.5314L13.4227 12.1803C12.8264 11.9093 11.9403 12.0405 11.6197 12.6657L10.1201 15.5908ZM10.1201 15.5908C8.95781 14.9362 7.86434 14.1142 6.87489 13.1248C5.88545 12.1353 5.06343 11.0419 4.40883 9.87958M4.40883 9.87958C3.58025 8.40839 3.01991 6.82693 2.7278 5.2066C2.65127 4.78204 2.80072 4.3515 3.10578 4.04646L3.99594 3.15635C4.7506 2.40169 6.0267 2.6331 6.46833 3.60468L7.81939 6.57702C8.09041 7.17326 7.95921 8.05942 7.33394 8.37998L4.40883 9.87958Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
