import { Bell, LogIn, LogOut, MapPin, MapPinOff, WifiOff, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const iconMap: Record<Notification['type'], { icon: typeof Bell; color: string; bg: string }> = {
  CHECK_IN: { icon: LogIn, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  CHECK_OUT: { icon: LogOut, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ENTERED_AREA: { icon: MapPin, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  LEFT_AREA: { icon: MapPinOff, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  OFFLINE: { icon: WifiOff, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
  GPS_STOPPED: { icon: MapPinOff, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  LATE: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ALERT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const { icon: Icon, color, bg } = iconMap[notification.type];
  return (
    <div
      onClick={() => onRead(notification.id)}
      className={clsx(
        'flex gap-3 p-3 rounded-xl cursor-pointer transition-colors',
        notification.isRead
          ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          : 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20'
      )}
    >
      <div className={clsx('p-2 rounded-lg shrink-0', bg)}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm', notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium')}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
      )}
    </div>
  );
}
