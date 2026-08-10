import clsx from 'clsx';
import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  change?: number;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, bgColor, change, subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4">
      <div className={clsx('p-3 rounded-xl', bgColor)}>
        <div className={clsx('w-6 h-6', color)}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {change !== undefined && (
        <div className={clsx('text-sm font-medium', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}
