import { Bell, Sun, Moon, Menu, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { useState } from 'react';
import clsx from 'clsx';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  title: string;
}

const LANGS = [
  { code: 'am', label: 'አማ' },
  { code: 'en', label: 'EN' },
  { code: 'om', label: 'OM' },
];

export default function Header({ onMenuClick, darkMode, onToggleDark, title }: HeaderProps) {
  const { i18n, t } = useTranslation();
  const unread = useSelector((s: RootState) => s.notifications.unreadCount);
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center gap-3">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden text-gray-600 dark:text-gray-300">
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">{title}</h1>

      <div className="flex items-center gap-1">
        {/* Language switcher */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className={clsx(
                'px-2.5 py-1.5 text-xs font-semibold transition-colors',
                i18n.language === l.code
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(p => !p)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar src={user?.avatar} name={user?.name ?? 'Admin'} size="sm" />
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{user?.name}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {t('settings.title')}
                </Link>
                <button onClick={() => { setUserMenuOpen(false); signOut(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
