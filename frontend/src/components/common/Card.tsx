import clsx from 'clsx';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export default function Card({ children, className, padding = true, hover = false }: CardProps) {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
      padding && 'p-5',
      hover && 'hover:shadow-md transition-shadow cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
}
