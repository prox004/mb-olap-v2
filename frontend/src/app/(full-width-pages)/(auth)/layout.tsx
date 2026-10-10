import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-sm text-center">
                <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white font-extrabold text-2xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
                    MB
                  </div>
                  <span className="text-2xl font-bold text-white tracking-tight">
                    M Baazar Analytics
                  </span>
                </Link>
                <p className="text-center text-sm text-gray-300 dark:text-white/70 font-medium">
                  Retail Operations &amp; Merchandise Management Platform
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
