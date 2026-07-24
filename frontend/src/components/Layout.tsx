import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Search,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = isAdmin
    ? [
        { to: '/admin', label: 'Panel', icon: LayoutDashboard },
        { to: '/admin/pending', label: 'Pendientes', icon: ClipboardCheck },
        { to: '/admin/search', label: 'Buscar', icon: Search },
        { to: '/admin/users', label: 'Usuarios', icon: Users },
      ]
    : [
        { to: '/', label: 'Mis Formatos', icon: FileText },
        { to: '/submissions', label: 'Mis Envíos', icon: ClipboardCheck },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-primary-700"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="text-xl font-bold tracking-tight">
                Colbeef<span className="text-primary-300">-Ops</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === to ||
                    (to !== '/admin' && to !== '/' && location.pathname.startsWith(to))
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-700/50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-primary-200">
                {user?.fullName}
                <span className="ml-2 text-xs bg-primary-700 px-2 py-0.5 rounded-full">
                  {isAdmin ? 'Admin' : 'Operario'}
                </span>
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-primary-700 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-primary-700 px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  location.pathname === to ||
                  (to !== '/admin' && to !== '/' && location.pathname.startsWith(to))
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-700/50'
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t bg-white py-4 text-center text-sm text-gray-500">
        Colbeef-Ops &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
