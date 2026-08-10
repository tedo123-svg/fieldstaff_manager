import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import clsx from 'clsx';

const PAGE_TITLES: Record<string, string> = {
  '/': 'nav.dashboard',
  '/organizations': 'nav.organizations',
  '/members': 'nav.members',
  '/live-map': 'nav.liveMap',
  '/attendance': 'nav.attendance',
  '/work-locations': 'nav.workLocations',
  '/reports': 'nav.reports',
  '/notifications': 'nav.notifications',
  '/settings': 'nav.settings',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const titleKey =
    Object.keys(PAGE_TITLES).find(k =>
      k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
    ) ?? '/';
  const title = t(PAGE_TITLES[titleKey] ?? 'nav.dashboard');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Fixed sidebar – desktop only */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* 
        Main content area.
        On lg+ screens we push it right by the sidebar width.
        'ml-64' = 256px (expanded), 'ml-16' = 64px (collapsed).
        Both classes are in the Tailwind safelist so they are never purged.
      */}
      <div
        className={clsx(
          'flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header
          onMenuClick={() => setMobileSidebarOpen(p => !p)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(p => !p)}
          title={title}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
