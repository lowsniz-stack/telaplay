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
  { to: '/logs', label: 'Exibições', icon: ScrollText },
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex h-20 items-center border-b border-gray-100 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vextor Mídia" className="h-14 w-14 rounded-xl object-contain" />
            <div className="leading-tight">
              <p className="text-base font-bold text-gray-900">Vextor Mídia</p>
              <p className="text-xs text-gray-400">Publicidade digital inteligente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 transition-colors hover:text-gray-600"
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