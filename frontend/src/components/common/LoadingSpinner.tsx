import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export default function LoadingSpinner({ size = 'md', center = false, label }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-2">
      <svg className={clsx('animate-spin text-green-600', sizes[size])} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      {label && <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>}
    </div>
  );
  if (center) {
    return <div className="flex items-center justify-center h-40">{spinner}</div>;
  }
  return spinner;
}
