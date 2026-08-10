import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  online?: boolean;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function colorFromName(name: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-purple-500', 'bg-red-500', 'bg-teal-500', 'bg-pink-500',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx('rounded-full object-cover', sizes[size])}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className={clsx('rounded-full flex items-center justify-center text-white font-semibold', sizes[size], colorFromName(name))}>
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span className={clsx(
          'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800',
          dotSizes[size],
          online ? 'bg-green-500' : 'bg-gray-400'
        )} />
      )}
    </div>
  );
}
