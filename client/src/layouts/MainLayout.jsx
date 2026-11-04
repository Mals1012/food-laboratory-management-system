import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Navbar isCollapsed={isCollapsed} />

        <main className="flex-1 mt-16 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-slate-200 text-center text-xs text-slate-400">
          FoodLab LIMS Enterprise Edition &copy; 2026 &bull; ISO/IEC 17025 Accredited Laboratory Management & Bull; Codex & FSSAI Compliant
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
