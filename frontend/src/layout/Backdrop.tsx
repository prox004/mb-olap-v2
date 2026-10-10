"use client";

import { useSidebar } from "@/context/SidebarContext";
import React from "react";

const Backdrop: React.FC = () => {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-xs transition-opacity duration-300 xl:hidden cursor-pointer"
      onClick={closeMobileSidebar}
      aria-label="Close mobile menu backdrop"
    />
  );
};

export default Backdrop;
