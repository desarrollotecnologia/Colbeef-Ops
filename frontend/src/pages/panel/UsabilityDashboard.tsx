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
  Eye,
  X,
  Shield,
} from 'lucide-react';
import api from '@/lib/api';
import PanelLayout from '@/components/PanelLayout';
import Button from '@/components/Button';

interface PanelUserRow {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  formatCount: number;
  formats: { id: string; code: string; name: string }[];
  submissionsCreated: number;
  submissionsReviewed: number;
}

interface PanelUserDetail extends PanelUserRow {
  password: {
    stored: boolean;
    readable: boolean;
    note: string;
  };
  formats: { id: string; code: string; name: string; documentCode?: string | null }[];
  stats: {
    submissionsCreated: number;
    submissionsSubmitted: number;
    submissionsReviewed: number;
  };
}

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
  const [users, setUsers] = useState<PanelUserRow[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PanelUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/analytics/dashboard?days=${days}`),
      api.get('/analytics/users'),
    ])
      .then(([dash, usersRes]) => {
        setData(dash.data);
        setUsers(usersRes.data);
      })
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

  const openDetail = (userId: string) => {
    setDetailLoading(true);
    setDetail(null);
    api
      .get(`/analytics/users/${userId}`)
      .then(({ data: d }) => setDetail(d))
      .finally(() => setDetailLoading(false));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
                      tickFormatter={(v: string) => String(v).slice(5)}
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
                      label={(props) => `${(props as { name?: string }).name ?? ''} ${(((props as { percent?: number }).percent ?? 0) * 100).toFixed(0)}%`}
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
                <h3 className="font-semibold text-slate-900">Resumen rápido</h3>
                <p className="text-xs text-slate-500 mt-0.5">Usuarios con actividad reciente</p>
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

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">Usuarios creados</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Solo consulta — sin crear ni eliminar. Incluye admin y operarios.
                </p>
              </div>
              <span className="text-xs text-slate-500">{users.length} cuentas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 font-medium">Correo</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Formatos</th>
                    <th className="px-5 py-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-medium text-slate-900">{u.fullName}</td>
                        <td className="px-5 py-3 text-slate-600">@{u.username}</td>
                        <td className="px-5 py-3 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-medium ${
                              u.active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{u.formatCount}</td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(u.id)}
                          >
                            <Eye size={14} /> Detalle
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-500 py-12">No se pudieron cargar los datos</p>
      )}

      {(detailLoading || detail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div
            className="absolute inset-0"
            onClick={() => {
              setDetail(null);
              setDetailLoading(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Detalle del usuario</h3>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                onClick={() => {
                  setDetail(null);
                  setDetailLoading(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading && !detail ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
              </div>
            ) : detail ? (
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{detail.fullName}</p>
                  <p className="text-sm text-slate-500">@{detail.username}</p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Correo</dt>
                    <dd className="font-medium text-slate-900 break-all">{detail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Rol</dt>
                    <dd className="font-medium text-slate-900">{roleLabel(detail.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Estado</dt>
                    <dd className={`font-medium ${detail.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {detail.active ? 'Activo' : 'Inactivo'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Creado</dt>
                    <dd className="font-medium text-slate-900">{formatDate(detail.createdAt)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Última actualización</dt>
                    <dd className="font-medium text-slate-900">{formatDate(detail.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
                  <Shield size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Contraseña</p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      {detail.password.note}
                      {detail.password.stored
                        ? ' Hay una contraseña registrada (solo hash cifrado).'
                        : ' No hay contraseña registrada.'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Actividad en formatos
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {detail.stats.submissionsCreated}
                      </p>
                      <p className="text-[11px] text-slate-500">Creados</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {detail.stats.submissionsSubmitted}
                      </p>
                      <p className="text-[11px] text-slate-500">Entregados</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-3">
                      <p className="text-lg font-semibold text-slate-900">
                        {detail.stats.submissionsReviewed}
                      </p>
                      <p className="text-[11px] text-slate-500">Revisados</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Formatos asignados ({detail.formats.length})
                  </p>
                  {detail.formats.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin formatos asignados</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                      {detail.formats.map((f) => (
                        <li
                          key={f.id}
                          className="text-sm text-slate-700 flex items-baseline gap-2"
                        >
                          <span className="text-xs font-mono text-slate-400 shrink-0">{f.code}</span>
                          <span className="truncate">{f.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
