import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Globe, Moon, Sun, Radio, Clock, Bell, Shield, Users, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const LANGS = [
  { code: 'am', label: 'አማርኛ (Amharic)', flag: '🇪🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'om', label: 'Afaan Oromo', flag: '🇪🇹' },
];

const ALERT_RULES = [
  { id: 'a1', type: 'LATE', label: 'Late Arrival Alert', description: 'Notify when member arrives more than N minutes late', enabled: true, threshold: 15 },
  { id: 'a2', type: 'OFFLINE', label: 'Offline Alert', description: 'Notify when member is offline for more than N minutes', enabled: true, threshold: 30 },
  { id: 'a3', type: 'LEFT_AREA', label: 'Left Work Area Alert', description: 'Notify when member leaves their assigned work area', enabled: true },
  { id: 'a4', type: 'ENTERED_AREA', label: 'Entered Work Area', description: 'Notify when member enters their assigned work area', enabled: false },
  { id: 'a5', type: 'GPS_STOPPED', label: 'GPS Sharing Stopped', description: 'Notify when member stops sharing GPS location', enabled: true },
];

const DEMO_USERS = [
  { id: 'u1', name: 'Super Admin', email: 'admin@fieldstaff.et', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  { id: 'u2', name: 'Org Manager', email: 'manager@fieldstaff.et', role: 'ORG_MANAGER', status: 'ACTIVE' },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [geofenceRadius, setGeofenceRadius] = useState('200');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [alertRules, setAlertRules] = useState(ALERT_RULES);
  const [activeSection, setActiveSection] = useState('general');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', String(next));
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const toggleRule = (id: string) => {
    setAlertRules(p => p.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = () => toast.success(t('settings.save') + ' — ' + t('common.success'));

  const SECTIONS = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'alerts', label: t('settings.alertRules'), icon: Bell },
    { key: 'tracking', label: 'Tracking', icon: Radio },
    ...(isSuperAdmin ? [{ key: 'users', label: t('settings.userManagement'), icon: Users }] : []),
    ...(isSuperAdmin ? [{ key: 'data', label: t('settings.dataRetention'), icon: Database }] : []),
    ...(isSuperAdmin ? [{ key: 'security', label: 'Security', icon: Shield }] : []),
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage system preferences and configuration</p>
        </div>
        <Button icon={<Save size={16} />} onClick={handleSave}>{t('settings.save')}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                  activeSection === key ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          {activeSection === 'general' && (
            <>
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Globe size={16} />{t('settings.language')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                        i18n.language === l.code
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      )}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <span className={clsx('text-sm font-medium', i18n.language === l.code ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300')}>{l.label}</span>
                      {i18n.language === l.code && <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  {darkMode ? <Moon size={16} /> : <Sun size={16} />}{t('settings.darkMode')}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle between light and dark theme</p>
                  </div>
                  <button
                    onClick={toggleDark}
                    className={clsx('relative w-12 h-6 rounded-full transition-colors', darkMode ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600')}
                  >
                    <span className={clsx('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', darkMode && 'translate-x-6')} />
                  </button>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'tracking' && (
            <>
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Radio size={16} />{t('settings.geofenceRadius')}</h3>
                <div className="flex items-center gap-4">
                  <Input
                    type="number" value={geofenceRadius} onChange={e => setGeofenceRadius(e.target.value)}
                    className="w-36" hint="meters"
                  />
                  <div className="text-sm text-gray-500">Default geofence radius applied to all new work locations</div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Clock size={16} />{t('settings.workingHours')}</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                    <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <span className="text-gray-400 text-sm mt-4">to</span>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Time</label>
                    <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Location tracking is only active during working hours to protect member privacy</p>
              </Card>
            </>
          )}

          {activeSection === 'alerts' && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Bell size={16} />{t('settings.alertRules')}</h3>
              <div className="space-y-4">
                {alertRules.map(rule => (
                  <div key={rule.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.label}</p>
                        <Badge label={rule.enabled ? 'Active' : 'Disabled'} variant={rule.enabled ? 'success' : 'default'} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{rule.description}</p>
                      {rule.threshold !== undefined && rule.enabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={rule.threshold}
                            className="w-20 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-xs text-gray-400">minutes</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={clsx('relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5', rule.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600')}
                    >
                      <span className={clsx('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', rule.enabled && 'translate-x-5')} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'users' && isSuperAdmin && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Users size={16} />{t('settings.userManagement')}</h3>
              <div className="space-y-3">
                {DEMO_USERS.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    <Badge label={u.role.replace('_', ' ')} variant={u.role === 'SUPER_ADMIN' ? 'purple' : 'info'} />
                    <Badge label={u.status} variant="success" />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4" icon={<Users size={14} />}>Add User</Button>
            </Card>
          )}

          {activeSection === 'data' && isSuperAdmin && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Database size={16} />{t('settings.dataRetention')}</h3>
              <div className="space-y-4">
                {[
                  { label: 'GPS Location Data', value: '90 days' },
                  { label: 'Attendance Records', value: '2 years' },
                  { label: 'Audit Logs', value: '1 year' },
                  { label: 'Notification History', value: '30 days' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                    <span className="text-sm font-medium text-green-600">{item.value}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">Data older than retention period is automatically deleted to protect member privacy.</p>
              </div>
            </Card>
          )}

          {activeSection === 'security' && isSuperAdmin && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Shield size={16} />Security</h3>
              <div className="space-y-4">
                {[
                  { label: 'JWT Authentication', status: 'Enabled', ok: true },
                  { label: 'Password Hashing (bcrypt)', status: 'Enabled', ok: true },
                  { label: 'Two-Factor Authentication', status: 'Optional', ok: true },
                  { label: 'HTTPS / TLS Encryption', status: 'Required in production', ok: true },
                  { label: 'Audit Logging', status: 'Enabled', ok: true },
                  { label: 'Role-Based Access Control', status: 'Enabled', ok: true },
                  { label: 'GPS Data Encryption', status: 'Enabled', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                    <Badge label={item.status} variant={item.ok ? 'success' : 'warning'} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
