import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, Mail, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const LANGS = [{ code: 'am', label: 'አማርኛ' }, { code: 'en', label: 'English' }, { code: 'om', label: 'Afaan Oromo' }];

// Demo credentials
const DEMO_USERS = [
  { email: 'admin@fieldstaff.et', password: 'admin123', name: 'Super Admin', role: 'SUPER_ADMIN' as const },
  { email: 'manager@fieldstaff.et', password: 'manager123', name: 'Org Manager', role: 'ORG_MANAGER' as const },
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@fieldstaff.et');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      login({ id: '1', email: user.email, name: user.name, role: user.role }, 'demo-jwt-token');
      toast.success(`${t('common.success')}! Welcome, ${user.name}`);
      navigate('/');
    } else {
      setError(t('auth.invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('language', l.code); }}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                i18n.language === l.code ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 pt-8 pb-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <span className="text-3xl font-black text-white">FS</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">{t('app.name')}</h1>
            <p className="text-green-200 text-sm text-center mt-1 font-ethiopic">{t('app.subtitle')}</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">{t('auth.login')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="admin@fieldstaff.et"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>{t('auth.loggingIn')}</>
                ) : t('auth.loginBtn')}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1"><Globe size={12} /> Demo Credentials:</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Admin: admin@fieldstaff.et / admin123</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Manager: manager@fieldstaff.et / manager123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
