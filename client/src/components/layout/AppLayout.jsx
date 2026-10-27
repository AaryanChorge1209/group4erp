import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1e293b)',
            borderRadius: '10px',
            border: '1px solid var(--toast-border, #e2e8f0)',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuToggle={() => setSidebarOpen(o => !o)} />

      <main className="lg:pl-60 pt-14 min-h-screen">
        <div className="p-4 md:p-6 max-w-screen-2xl">
          <Outlet />
        </div>
        <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6 border-t border-gray-200 dark:border-slate-700 mt-8">
          © 2024 Kirti M Doongursee College of Arts, Science & Commerce — ERP v1.0.0 &nbsp;|&nbsp; All Rights Reserved
        </footer>
      </main>
    </div>
  );
}
