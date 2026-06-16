import { ReactNode } from 'react';
import { LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: ReactNode;
}

export default function PanelLayout({ children }: Props) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <BarChart3 size={22} className="text-emerald-300" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide">Colbeef-Ops</p>
              <p className="text-[11px] text-slate-400">Panel de usabilidad</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:inline">{user?.fullName}</span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
