import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  ListVideo,
  Image,
  Building2,
  LogOut,
  Eye,
  ScrollText,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import clsx from 'clsx';
import logo from '../../assets/logo.png';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/screens', label: 'Telas', icon: Monitor },
  { to: '/preview', label: 'Preview', icon: Eye },
  { to: '/playlists', label: 'Playlists', icon: ListVideo },
  { to: '/media', label: 'Mídias', icon: Image },
  { to: '/companies', label: 'Empresas', icon: Building2 },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/change-password', label: 'Trocar senha', icon: KeyRound },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="h-20 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TelaPlay" className="h-14 w-14 object-contain rounded-xl" />
            <div className="leading-tight">
              <p className="text-base font-bold text-gray-900">TelaPlay</p>
              <p className="text-xs text-gray-400">Painel de mídia digital</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}