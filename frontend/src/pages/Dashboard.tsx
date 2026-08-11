import { useEffect, useState } from 'react';
import { Users, UserCheck, Briefcase, Navigation, UserX, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import OrgChart from '../components/charts/OrgChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import NotificationItem from '../components/notifications/NotificationItem';
import MemberCard from '../components/members/MemberCard';
import { useDispatch, useSelector } from 'react-redux';
import { markRead } from '../store/notificationsSlice';
import type { RootState } from '../store';
import type { DashboardStats, Member } from '../types';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const notifications = useSelector((s: RootState) => s.notifications.items);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        // Load members for active members widget
        const { data: membersData } = await supabase
          .from('members')
          .select('*, organization:organizations(*), workLocation:work_locations(*), lastLocation:gps_locations(*), todayAttendance:attendances(*)')
          .eq('is_sharing', true)
          .limit(4);

        if (membersData) setActiveMembers(membersData as Member[]);

        // Load dashboard stats
        const { data: statsData } = await supabase.rpc('get_dashboard_stats');
        if (statsData) setStats(statsData as DashboardStats);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const statCards = stats ? [
    { title: t('dashboard.totalMembers'), value: stats.totalMembers, icon: <Users size={24} />, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: t('dashboard.activeMembers'), value: stats.activeMembers, icon: <UserCheck size={24} />, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { title: t('dashboard.currentlyWorking'), value: stats.currentlyWorking, icon: <Briefcase size={24} />, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: t('dashboard.sharingLocation'), value: stats.sharingLocation, icon: <Navigation size={24} />, color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
    { title: t('dashboard.absentMembers'), value: stats.absentMembers, icon: <UserX size={24} />, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { title: t('dashboard.outsideAssigned'), value: stats.outsideAssigned, icon: <AlertTriangle size={24} />, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Org chart */}
        {stats && (
          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.orgStatistics')}</h3>
              <Link to="/organizations" className="text-xs text-green-600 hover:underline">{t('orgs.viewAll')}</Link>
            </div>
            <OrgChart data={stats.orgStats} />
            <div className="flex flex-wrap gap-3 mt-4">
              {stats.orgStats.map(org => (
                <div key={org.orgId} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{org.name}</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">({org.total})</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('nav.notifications')}</h3>
            <Link to="/notifications" className="text-xs text-green-600 hover:underline">{t('common.view')}</Link>
          </div>
          <div className="space-y-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('notifications.noNotifications')}</p>
            ) : notifications.slice(0, 5).map(n => (
              <NotificationItem key={n.id} notification={n} onRead={id => dispatch(markRead(id))} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.quickAttendance')}</h3>
            <Link to="/attendance" className="text-xs text-green-600 hover:underline">{t('common.view')}</Link>
          </div>
          {stats && (
            <div className="flex gap-4 mb-4">
              {[
                { label: t('status.present'), value: stats.currentlyWorking, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                { label: t('status.absent'), value: stats.absentMembers, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
              ].map(item => (
                <div key={item.label} className={`flex-1 rounded-lg p-3 text-center ${item.bg}`}>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          )}
          <AttendanceChart />
        </Card>

        {/* Active members */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('map.activeMembers')}</h3>
            <Link to="/members" className="text-xs text-green-600 hover:underline">{t('common.view')}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeMembers.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
          {activeMembers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">{t('map.noActiveMembers')}</p>
          )}
        </Card>
      </div>

      {/* Recent activity (notifications) */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.recentActivity')}</h3>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('notifications.noNotifications')}</p>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 6).map(n => (
              <div key={n.id} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 flex-1">{n.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
