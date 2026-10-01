import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Search } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import { INPUT_CLASS } from '@/lib/formUtils';
import type { ChangeControlModule } from '@/types';

export function formatChangeDate(value: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export default function AdminChangeControlPage() {
  const [modules, setModules] = useState<ChangeControlModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get<ChangeControlModule[]>('/admin/change-control')
      .then(({ data }) => setModules(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      [m.name, m.code, m.documentCode ?? ''].some((s) => s.toLowerCase().includes(q))
    );
  }, [modules, query]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de cambios</h1>
          <p className="text-gray-500 mt-1">
            Historial de versiones y cambios de estructura de cada formato
          </p>
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${INPUT_CLASS} pl-9`}
            placeholder="Buscar formato o código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <Link key={m.code} to={`/admin/control-cambios/${m.code}`}>
            <Card className="hover:shadow-md hover:border-primary-300 transition-all cursor-pointer h-full">
              <CardBody className="flex flex-col gap-3 h-full">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <History className="text-primary-700" size={24} />
                  </div>
                  {m.currentVersion ? (
                    <span className="text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2 py-1 rounded-full">
                      Versión {m.currentVersion}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      Sin registros
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.documentCode || m.code}</p>
                </div>
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 flex justify-between">
                  <span>
                    {m.entryCount} {m.entryCount === 1 ? 'cambio' : 'cambios'}
                  </span>
                  <span>Último: {formatChangeDate(m.lastChangeDate)}</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">No se encontraron formatos</p>
      )}
    </Layout>
  );
}
