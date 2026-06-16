import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Activity,
  Users,
  FileText,
  LogIn,
  RefreshCw,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';
import PanelLayout from '@/components/PanelLayout';
import Button from '@/components/Button';

interface DashboardData {
  periodDays: number;
  summary: {
    totalEvents: number;
    eventsToday: number;
    activeUsersToday: number;
    loginsToday: number;
    registeredUsers: number;
  };
  eventsByType: { type: string; label: string; count: number }[];
  eventsByDay: { date: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  topUsers: { userId: string; username: string; fullName: string; role: string; eventCount: number }[];
  topFormats: { formatCode: string; formatName: string; count: number }[];
  topPages: { path: string; label: string; count: number }[];
  hourlyActivity: { hour: string; count: number }[];
  submissionsByStatus: { status: string; label: string; count: number }[];
  recentActivity: {
    id: string;
    eventType: string;
    label: string;
    username?: string;
    fullName?: string;
    userRole?: string;
    path?: string;
    formatName?: string;
    sheetName?: string;
    createdAt: string;
  }[];
  users: { id: string; username: string; fullName: string; role: string }[];
}

const CHART_COLORS = [
  '#059669',
  '#0d9488',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#ca8a04',
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  PENDING_REVIEW: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex gap-4">
      <div className={`p-3 rounded-xl ${accent} shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 ${className}`}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function UsabilityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get(`/analytics/dashboard?days=${days}`)
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [days]);

  const roleLabel = (role?: string) => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'OPERARIO') return 'Operario';
    return role ?? '—';
  };

  return (
    <PanelLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Uso del programa</h1>
          <p className="text-slate-500 text-sm mt-1">
            Quién usa Colbeef-Ops, qué formatos trabajan y cómo se mueven en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
          </select>
          <Button variant="outline" onClick={load} loading={loading}>
            <RefreshCw size={16} /> Actualizar
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Activity}
              label="Eventos hoy"
              value={data.summary.eventsToday}
              sub={`${data.summary.totalEvents} en ${data.periodDays} días`}
              accent="bg-emerald-500"
            />
            <StatCard
              icon={Users}
              label="Usuarios activos hoy"
              value={data.summary.activeUsersToday}
              sub={`${data.summary.registeredUsers} registrados`}
              accent="bg-teal-500"
            />
            <StatCard
              icon={LogIn}
              label="Inicios de sesión hoy"
              value={data.summary.loginsToday}
              accent="bg-cyan-600"
            />
            <StatCard
              icon={FileText}
              label="Formatos en sistema"
              value={data.topFormats.length > 0 ? data.topFormats.reduce((a, b) => a + b.count, 0) : 0}
              sub="Acciones sobre formatos"
              accent="bg-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Actividad por día" subtitle="Movimiento total en el período" className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.eventsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => `Fecha: ${v}`} />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Por tipo de acción" subtitle="Distribución de eventos">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.eventsByType.slice(0, 8)}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.eventsByType.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Usuarios más activos" subtitle="Por cantidad de acciones">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topUsers} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="fullName"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="eventCount" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Formatos más usados" subtitle="Creación, guardado, entrega, revisión">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topFormats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="formatName"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Actividad por rol" subtitle="Admin vs operario">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.usersByRole}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ role, percent }) => `${role} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#2563eb" />
                      <Cell fill="#059669" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Estado de envíos" subtitle="En la base de datos">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.submissionsByStatus}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {data.submissionsByStatus.map((row) => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Páginas más visitadas" subtitle="Navegación en la app">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topPages} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Actividad por hora (hoy)" subtitle="Distribución del día actual">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0891b2" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Actividad reciente</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {data.recentActivity.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 text-center">Sin actividad registrada aún</p>
                ) : (
                  data.recentActivity.map((ev) => (
                    <div key={ev.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{ev.label}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {ev.fullName ?? ev.username ?? '—'}
                          {ev.formatName && ` · ${ev.formatName}`}
                          {ev.sheetName && ` · ${ev.sheetName}`}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 shrink-0">
                        {new Date(ev.createdAt).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Usuarios del sistema</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cuentas operativas</p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {data.users.map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{u.fullName}</p>
                      <p className="text-xs text-slate-500">@{u.username}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full shrink-0 ${
                        u.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-500 py-12">No se pudieron cargar los datos</p>
      )}
    </PanelLayout>
  );
}
