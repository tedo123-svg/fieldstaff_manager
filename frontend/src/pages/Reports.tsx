import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import { MEMBERS, ORGANIZATIONS, getAttendanceHistory } from '../data/mockData';
import type { ReportFilter } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const REPORT_TYPES = [
  { key: 'members', labelKey: 'reports.memberList', icon: '👥' },
  { key: 'attendance', labelKey: 'reports.attendanceReport', icon: '📋' },
  { key: 'location', labelKey: 'reports.locationReport', icon: '📍' },
  { key: 'late', labelKey: 'reports.lateArrival', icon: '⏰' },
  { key: 'outside', labelKey: 'reports.outsideArea', icon: '⚠️' },
] as const;

const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export default function Reports() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ReportFilter>({
    type: 'members', dateFrom: weekAgo, dateTo: today, organizationId: '', memberId: '',
  });
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => { setGenerated(true); toast.success('Report generated'); };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast.success(`Exporting as ${format.toUpperCase()}...`);
    // In production: call backend API to generate and download file
  };

  const attendanceHistory = getAttendanceHistory();

  const getReportData = () => {
    switch (filter.type) {
      case 'members': {
        let data = MEMBERS;
        if (filter.organizationId) data = data.filter(m => m.organizationId === filter.organizationId);
        if (filter.memberId) data = data.filter(m => m.id === filter.memberId);
        return data;
      }
      case 'attendance':
      case 'late':
      case 'outside': {
        let data = attendanceHistory.filter(a => a.date >= filter.dateFrom && a.date <= filter.dateTo);
        if (filter.organizationId) data = data.filter(a => a.member?.organizationId === filter.organizationId);
        if (filter.memberId) data = data.filter(a => a.memberId === filter.memberId);
        if (filter.type === 'late') data = data.filter(a => a.status === 'LATE');
        if (filter.type === 'outside') data = MEMBERS.filter(m => {
          if (filter.organizationId && m.organizationId !== filter.organizationId) return false;
          return m.locationStatus === 'OUTSIDE';
        }) as unknown as typeof data;
        return data;
      }
      case 'location': {
        let data = MEMBERS.filter(m => m.lastLocation);
        if (filter.organizationId) data = data.filter(m => m.organizationId === filter.organizationId);
        return data;
      }
      default: return [];
    }
  };

  const reportData = generated ? getReportData() : [];

  const renderTable = () => {
    if (!generated || reportData.length === 0) return (
      <div className="text-center py-16 text-gray-400">
        {generated ? t('reports.noData') : 'Configure filters and click Generate Report'}
      </div>
    );

    if (filter.type === 'members') {
      const members = reportData as typeof MEMBERS;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>{['#', 'Name', 'ID', 'Organization', 'Role', 'Phone', 'Status', 'Reg. Date'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={m.profilePhoto} name={m.fullName} size="xs" />
                      <span className="font-medium text-gray-900 dark:text-white">{m.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{m.memberId}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: m.organization?.color + '20', color: m.organization?.color }}>{m.organization?.name}</span></td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{m.jobRole}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{m.phone}</td>
                  <td className="py-3 px-4"><Badge label={m.status} variant={m.status === 'ACTIVE' ? 'success' : 'default'} /></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{format(new Date(m.registrationDate), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filter.type === 'attendance' || filter.type === 'late') {
      const records = reportData as ReturnType<typeof getAttendanceHistory>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>{['Member', 'Organization', 'Date', 'Check In', 'Check Out', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{r.member?.fullName}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: r.member?.organization?.color + '20', color: r.member?.organization?.color }}>{r.member?.organization?.name}</span></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{format(new Date(r.date + 'T00:00:00'), 'dd MMM yyyy')}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{r.checkIn ?? '–'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{r.checkOut ?? '–'}</td>
                  <td className="py-3 px-4"><Badge label={r.status} variant={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : r.status === 'LATE' ? 'warning' : 'info'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filter.type === 'location' || filter.type === 'outside') {
      const members = reportData as typeof MEMBERS;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>{['Member', 'Organization', 'GPS Status', 'Latitude', 'Longitude', 'Last Updated'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{m.fullName}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: m.organization?.color + '20', color: m.organization?.color }}>{m.organization?.name}</span></td>
                  <td className="py-3 px-4"><Badge label={m.locationStatus ?? 'OFFLINE'} variant={m.locationStatus === 'AT_WORK' ? 'success' : m.locationStatus === 'NEARBY' ? 'warning' : m.locationStatus === 'OUTSIDE' ? 'danger' : 'default'} /></td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{m.lastLocation?.latitude.toFixed(5) ?? '–'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{m.lastLocation?.longitude.toFixed(5) ?? '–'}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{m.lastLocation ? format(new Date(m.lastLocation.timestamp), 'dd MMM HH:mm') : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar filters */}
        <Card className="xl:col-span-1 h-fit">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Filter size={16} /> Filters
          </h3>
          <div className="space-y-4">
            {/* Report type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Report Type</label>
              <div className="space-y-1.5">
                {REPORT_TYPES.map(rt => (
                  <button
                    key={rt.key}
                    onClick={() => { setFilter(p => ({ ...p, type: rt.key })); setGenerated(false); }}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      filter.type === rt.key ? 'bg-green-600 text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <span>{rt.icon}</span>{t(rt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            {filter.type !== 'members' && filter.type !== 'location' && filter.type !== 'outside' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('reports.dateFrom')}</label>
                  <input type="date" value={filter.dateFrom} onChange={e => setFilter(p => ({ ...p, dateFrom: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('reports.dateTo')}</label>
                  <input type="date" value={filter.dateTo} onChange={e => setFilter(p => ({ ...p, dateTo: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            )}

            {/* Organization */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('members.organization')}</label>
              <select value={filter.organizationId} onChange={e => setFilter(p => ({ ...p, organizationId: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">{t('common.all')}</option>
                {ORGANIZATIONS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>

            <Button onClick={handleGenerate} className="w-full justify-center">{t('reports.generate')}</Button>
          </div>
        </Card>

        {/* Report content */}
        <div className="xl:col-span-3 space-y-4">
          {/* Export buttons */}
          {generated && reportData.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={<FileText size={14} />} onClick={() => handleExport('pdf')}>{t('reports.exportPDF')}</Button>
              <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} />} onClick={() => handleExport('excel')}>{t('reports.exportExcel')}</Button>
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => handleExport('csv')}>{t('reports.exportCSV')}</Button>
              <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 self-center">{reportData.length} records</span>
            </div>
          )}

          <Card padding={false}>
            {renderTable()}
          </Card>
        </div>
      </div>
    </div>
  );
}
