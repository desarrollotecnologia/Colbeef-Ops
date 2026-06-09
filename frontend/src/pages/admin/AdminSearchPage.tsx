import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import type { FormSubmission } from '@/types';

export default function AdminSearchPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState<FormSubmission[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: 'APPROVED' };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get('/submissions', { params });
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buscar formatos</h1>
        <p className="text-gray-500 mt-1">Consulte formatos aprobados por rango de fechas (auditoría)</p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <Button onClick={handleSearch} loading={loading}>
              <Search size={18} /> Buscar
            </Button>
          </div>
        </CardBody>
      </Card>

      {searched && (
        results.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12 text-gray-500">
              No se encontraron formatos en ese rango de fechas
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{results.length} resultado(s) encontrado(s)</p>
            {results.map((sub) => (
              <Card key={sub.id}>
                <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Link to={`/admin/review/${sub.id}`} className="font-semibold text-primary-700 hover:underline">
                      {sub.format?.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {sub.operator?.fullName} — {new Date(sub.workDate).toLocaleDateString('es-CO')}
                    </p>
                    {sub.signature && (
                      <p className="text-xs text-green-600">
                        Firmado: {new Date(sub.signature.signedAt).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" disabled title="PDF — próximamente">
                    <Download size={16} /> PDF
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )
      )}
    </Layout>
  );
}
