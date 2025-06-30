"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  onDataChange?: () => void;
}

const AppLayout = ({ children, onDataChange }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <div className="h-screen pb-20 md:pb-0 md:ml-20">
        <main className="h-full">
          {children}
        </main>
      </div>
      
      {/* Sidebar - 手機版下排，桌面版左側 */}
      <Sidebar onDataChange={onDataChange} />
    </div>
  );
};

export default AppLayout; 