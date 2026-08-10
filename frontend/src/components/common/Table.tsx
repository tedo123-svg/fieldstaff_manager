import clsx from 'clsx';
import { type ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export default function Table<T extends Record<string, unknown>>({
  columns, data, keyField = 'id', onRowClick, emptyMessage = 'No data found', loading,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map(col => (
              <th key={col.key} className={clsx('text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider', col.width)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">{emptyMessage}</td></tr>
          ) : data.map((row, i) => (
            <tr
              key={String(row[keyField] ?? i)}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'border-b border-gray-100 dark:border-gray-700/50 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
            >
              {columns.map(col => (
                <td key={col.key} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
