import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary-50 p-6">
          <div className="max-w-full mx-auto px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
