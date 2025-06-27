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
      {/* Sidebar */}
      <Sidebar onDataChange={onDataChange} />
      
      {/* Main Content */}
      <div className="ml-20 h-screen">
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 