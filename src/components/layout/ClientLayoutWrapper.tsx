"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";

// 動態導入 AppLayout 以避免 SSR 問題
const AppLayout = dynamic(() => import("./AppLayout"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  ),
});

interface ClientLayoutWrapperProps {
  children: ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return <AppLayout>{children}</AppLayout>;
} 