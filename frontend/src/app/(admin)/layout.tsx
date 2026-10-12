"use client";

import { useSidebar } from "@/context/SidebarContext";
import { OlapFilterProvider } from "@/context/OlapFilterContext";
import { OlapFilterBar } from "@/components/common/OlapFilterBar";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { FloatingChatDrawer } from "@/components/chat/FloatingChatDrawer";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Authenticating workspace...
        </p>
      </div>
    );
  }

  // Dynamic margin: 280px when expanded, 76px when collapsed (mini-icon bar), 0 on mobile
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded
    ? "xl:ml-[280px]"
    : "xl:ml-[76px]";

  // Clean full-width padding without restrictive centering or artificial max-width
  const getRouteSpecificStyles = () => {
    switch (pathname) {
      case "/text-generator":
      case "/code-generator":
      case "/image-generator":
      case "/video-generator":
        return "w-full";
      case "/report-builder":
      case "/comparison":
        return "p-3 sm:p-4 md:p-6 w-full min-w-0";
      default:
        return "p-4 md:p-6 w-full min-w-0";
    }
  };

  return (
    <OlapFilterProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
        {/* Sidebar (Mini 76px collapsed / 280px expanded / Mobile drawer) */}
        <AppSidebar />

        {/* Backdrop for Mobile Drawer */}
        <Backdrop />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />

          {/* Page Content */}
          <main className={`flex-1 min-w-0 ${getRouteSpecificStyles()}`}>
            {pathname !== "/olap-assistant" &&
              pathname !== "/profile" &&
              pathname !== "/report-builder" &&
              pathname !== "/comparison" && <OlapFilterBar />}
            {children}
          </main>
        </div>

        {/* Global Floating Smart Retail AI Assistant Drawer */}
        <FloatingChatDrawer />
      </div>
    </OlapFilterProvider>
  );
}
