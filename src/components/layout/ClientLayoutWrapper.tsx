"use client";

import { ReactNode, Suspense } from "react";
import dynamic from "next/dynamic";

// 動態導入 AppLayout 以避免 SSR 問題
const AppLayout = dynamic(() => import("./AppLayout"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-400 font-medium">Loading App...</p>
      </div>
    </div>
  ),
});

// 錯誤邊界組件
const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
};

interface ClientLayoutWrapperProps {
  children: ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-400 font-medium">Loading...</p>
          </div>
        </div>
      }>
        <AppLayout>{children}</AppLayout>
      </Suspense>
    </ErrorBoundary>
  );
} 