import CountdownTimer from "@/components/common/CountdownTimer";
import GridShape from "@/components/common/GridShape";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Next.js Coming Soon Page | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Coming Soon page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function ComingSoon() {
  // Set the target date to 29 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 29);
  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen p-6 overflow-hidden z-1">
      <GridShape />

      <div>
        <div className="mx-auto w-full max-w-[460px] text-center">
          <Link href="/" className="inline-block mb-6">
            <Image
              className="dark:hidden"
              src="./images/logo/logo.svg"
              alt="Logo"
              width={154}
              height={32}
            />
            <Image
              className="hidden dark:block"
              src="./images/logo/logo-dark.svg"
              alt="Logo"
              width={154}
              height={32}
            />
          </Link>

          <h1 className="mb-3 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-xl">
            Coming Soon
          </h1>

          <p className="text-base text-gray-500 mb-9 dark:text-gray-400">
            Our website is currently under construction, enter your email id to
            get latest updates and notifications about the website.
          </p>

          {/* <!-- ===== Countdown Timer Start ===== --> */}
          <CountdownTimer targetDate={targetDate} />
          {/* <!-- ===== Countdown Timer End ===== --> */}

          <p className="mb-5 text-sm text-gray-700 dark:text-gray-400">
            Don’t want to miss update? Subscribe now
          </p>

          <form>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <div className="w-full sm:w-[320px]">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email address"
                  className="w-full px-4 py-3 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg h-11 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:shadow-focus-ring focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-400 dark:focus:border-brand-300"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600 sm:w-auto"
              >
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
                    d="M10.7497 2.29248C10.7497 1.87827 10.4139 1.54248 9.99967 1.54248C9.58546 1.54248 9.24967 1.87827 9.24967 2.29248V2.83613C6.0823 3.20733 3.62467 5.9004 3.62467 9.16748V14.4591H3.33301C2.91879 14.4591 2.58301 14.7949 2.58301 15.2091C2.58301 15.6234 2.91879 15.9591 3.33301 15.9591H4.37467H15.6247H16.6663C17.0806 15.9591 17.4163 15.6234 17.4163 15.2091C17.4163 14.7949 17.0806 14.4591 16.6663 14.4591H16.3747V9.16748C16.3747 5.9004 13.9171 3.20733 10.7497 2.83613V2.29248ZM14.8747 14.4591V9.16748C14.8747 6.47509 12.6921 4.29248 9.99967 4.29248C7.30729 4.29248 5.12467 6.47509 5.12467 9.16748V14.4591H14.8747ZM7.99967 17.7085C7.99967 18.1228 8.33546 18.4585 8.74967 18.4585H11.2497C11.6639 18.4585 11.9997 18.1228 11.9997 17.7085C11.9997 17.2943 11.6639 16.9585 11.2497 16.9585H8.74967C8.33546 16.9585 7.99967 17.2943 7.99967 17.7085Z"
                    fill=""
                  />
                </svg>
                Notify Me
              </button>
            </div>
          </form>
        </div>

        <div className="absolute -translate-x-1/2 bottom-6 left-1/2">
          <p className="mt-20 mb-6 text-base text-center text-gray-500 dark:text-gray-400">
            Follow Us On
          </p>

          <div className="flex items-center justify-center gap-5">
            <a
              href="#"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <svg
                className="fill-current"
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6663 12.1366H13.7497L14.583 8.80322H11.6663V7.13656C11.6663 6.27874 11.6663 5.46989 13.333 5.46989H14.583V2.66997C14.3116 2.63393 13.2855 2.55322 12.2021 2.55322C9.94001 2.55322 8.33301 3.93394 8.33301 6.46965V8.80322H5.83301V12.1366H8.33301V19.2199H11.6663V12.1366Z"
                  fill=""
                />
              </svg>
            </a>

            <a
              href="#"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <svg
                className="fill-current"
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.171 2.76172H17.9277L11.9052 9.64505L18.9902 19.0117H13.4427L9.09766 13.3309L4.12603 19.0117H1.3677L7.80936 11.6492L1.0127 2.76172H6.70103L10.6285 7.95422L15.171 2.76172ZM14.2035 17.3617H15.731L5.87103 4.32505H4.23186L14.2035 17.3617Z"
                  fill=""
                />
              </svg>
            </a>

            <a
              href="#"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <svg
                className="fill-current"
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.78357 5.05316C5.78326 5.73176 5.37157 6.34241 4.74262 6.59716C4.11367 6.85193 3.39306 6.69993 2.92059 6.21285C2.44811 5.72576 2.31813 5.00085 2.59192 4.37995C2.86572 3.75905 3.48862 3.36614 4.1669 3.3865C5.0678 3.41354 5.78398 4.15186 5.78357 5.05316ZM5.83357 7.95316H2.50024V18.3865H5.83357V7.95316ZM11.1003 7.95316H7.78357V18.3865H11.0669V12.9115C11.0669 9.86147 15.0419 9.57814 15.0419 12.9115V18.3865H18.3336V11.7781C18.3336 6.6365 12.4503 6.82816 11.0669 9.35314L11.1003 7.95316Z"
                  fill=""
                />
              </svg>
            </a>

            <a
              href="#"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            >
              <svg
                className="fill-current"
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.8572 2.5542C11.7951 2.55575 12.2703 2.56072 12.681 2.57294L12.8427 2.57822C13.0296 2.58487 13.2139 2.5932 13.4362 2.60362C14.3229 2.64459 14.9278 2.78487 15.4591 2.99112C16.0083 3.20292 16.4722 3.48903 16.9354 3.95223C17.3979 4.41542 17.6841 4.8807 17.8966 5.42862C18.1021 5.95917 18.2424 6.56473 18.2841 7.45153C18.294 7.67376 18.302 7.85809 18.3086 8.04496L18.3138 8.2067C18.326 8.61732 18.3316 9.09264 18.3333 10.0305L18.334 10.6518C18.3341 10.7278 18.3341 10.8061 18.3341 10.8869L18.334 11.122L18.3335 11.7434C18.3319 12.6813 18.327 13.1566 18.3147 13.5672L18.3094 13.7289C18.3028 13.9158 18.2945 14.1002 18.2841 14.3223C18.2431 15.2092 18.1021 15.814 17.8966 16.3453C17.6847 16.8946 17.3979 17.3585 16.9354 17.8217C16.4722 18.2842 16.0062 18.5703 15.4591 18.7828C14.9278 18.9883 14.3229 19.1286 13.4362 19.1703C13.2139 19.1802 13.0296 19.1883 12.8427 19.1948L12.681 19.2C12.2703 19.2123 11.7951 19.2178 10.8572 19.2196L10.2358 19.2203C10.1599 19.2203 10.0816 19.2203 10.0007 19.2203H9.76565L9.14424 19.2197C8.2064 19.2182 7.73109 19.2132 7.32046 19.2009L7.15873 19.1957C6.97185 19.189 6.78752 19.1807 6.5653 19.1703C5.67849 19.1293 5.07433 18.9883 4.54239 18.7828C3.99377 18.571 3.52919 18.2842 3.06599 17.8217C2.6028 17.3585 2.31739 16.8925 2.10489 16.3453C1.89864 15.814 1.75905 15.2092 1.71739 14.3223C1.70749 14.1002 1.69941 13.9158 1.69287 13.7289L1.68763 13.5672C1.67544 13.1566 1.66988 12.6813 1.66808 11.7434L1.66797 10.0305C1.66952 9.09264 1.67448 8.61732 1.6867 8.2067L1.69199 8.04496C1.69864 7.85809 1.70697 7.67376 1.71739 7.45153C1.75835 6.56403 1.89864 5.95987 2.10489 5.42862C2.31669 4.88001 2.6028 4.41542 3.06599 3.95223C3.52919 3.48903 3.99447 3.20362 4.54239 2.99112C5.07364 2.78487 5.6778 2.64528 6.5653 2.60362C6.78752 2.59372 6.97185 2.58565 7.15873 2.57911L7.32046 2.57387C7.73109 2.56167 8.2064 2.55611 9.14424 2.55431L10.8572 2.5542ZM10.0007 6.72028C7.6983 6.72028 5.83405 8.58656 5.83405 10.8869C5.83405 13.1893 7.70033 15.0536 10.0007 15.0536C12.3032 15.0536 14.1674 13.1873 14.1674 10.8869C14.1674 8.58453 12.3011 6.72028 10.0007 6.72028ZM10.0007 8.38695C11.3815 8.38695 12.5007 9.50584 12.5007 10.8869C12.5007 12.2677 11.3818 13.3869 10.0007 13.3869C8.61999 13.3869 7.50072 12.2681 7.50072 10.8869C7.50072 9.50617 8.61957 8.38695 10.0007 8.38695ZM14.3757 5.47028C13.8013 5.47028 13.3341 5.93687 13.3341 6.51124C13.3341 7.08562 13.8007 7.55292 14.3757 7.55292C14.9501 7.55292 15.4174 7.08634 15.4174 6.51124C15.4174 5.93687 14.9493 5.46957 14.3757 5.47028Z"
                  fill=""
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
