import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Building2, Users, Map, ClipboardList,
  MapPin, FileBarChart, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Group,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV = [
  { to: '/',              icon: LayoutDashboard, key: 'dashboard' },
  { to: '/organizations', icon: Building2,       key: 'organizations' },
  { to: '/members',       icon: Users,           key: 'members' },
  { to: '/groups',        icon: Group,           key: 'groups' },
  { to: '/live-map',      icon: Map,             key: 'liveMap' },
  { to: '/attendance',    icon: ClipboardList,   key: 'attendance' },
  { to: '/work-locations',icon: MapPin,          key: 'workLocations' },
  { to: '/reports',       icon: FileBarChart,    key: 'reports' },
  { to: '/notifications', icon: Bell,            key: 'notifications' },
  { to: '/settings',      icon: Settings,        key: 'settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const location = useLocation();
  const unread = useSelector((s: RootState) => s.notifications.unreadCount);

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 z-40 shadow-xl',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-gray-700/50', collapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-lg font-bold">FS</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">FieldStaff</p>
            <p className="text-xs text-gray-400 truncate">Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, key }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group relative',
                active
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700/60 hover:text-white',
                collapsed && 'justify-center'
              )}
              title={collapsed ? t(`nav.${key}`) : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{t(`nav.${key}`)}</span>}
              {key === 'notifications' && unread > 0 && (
                <span className={clsx(
                  'text-xs bg-red-500 text-white rounded-full font-bold',
                  collapsed ? 'absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px]' : 'ml-auto px-1.5 py-0.5'
                )}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-700/50 p-3 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? t('nav.logout') : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
