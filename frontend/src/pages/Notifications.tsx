import { useTranslation } from 'react-i18next';
import { CheckCheck, Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { markRead, markAllRead } from '../store/notificationsSlice';
import type { RootState } from '../store';
import NotificationItem from '../components/notifications/NotificationItem';
import Button from '../components/common/Button';
import { useState } from 'react';
import clsx from 'clsx';

const FILTERS = ['all', 'unread', 'CHECK_IN', 'CHECK_OUT', 'LATE', 'OFFLINE', 'LEFT_AREA', 'ENTERED_AREA'] as const;

export default function Notifications() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = items.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const filterLabels: Record<string, string> = {
    all: t('common.all'),
    unread: `Unread (${unreadCount})`,
    CHECK_IN: 'Check In',
    CHECK_OUT: 'Check Out',
    LATE: 'Late Arrival',
    OFFLINE: 'Offline',
    LEFT_AREA: 'Left Area',
    ENTERED_AREA: 'Entered Area',
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={<CheckCheck size={14} />} onClick={() => dispatch(markAllRead())}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeFilter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {filterLabels[f] ?? f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell size={40} className="mb-3 opacity-30" />
            <p>{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(n => (
              <div key={n.id} className="px-4 py-1">
                <NotificationItem notification={n} onRead={id => dispatch(markRead(id))} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
