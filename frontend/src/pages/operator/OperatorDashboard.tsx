import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Layers } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import type { Format } from '@/types';

export default function OperatorDashboard() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/formats').then(({ data }) => setFormats(data)).finally(() => setLoading(false));
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Formatos del día</h1>
        <p className="text-gray-500 mt-1">Seleccione un formato para comenzar a llenar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((format) => (
          <Link key={format.id} to={`/formats/${format.id}/new`}>
            <Card className="hover:shadow-md hover:border-primary-300 transition-all cursor-pointer h-full">
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="text-primary-700" size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <Layers size={14} />
                    {format.sheetCount} {format.sheetCount === 1 ? 'hoja' : 'hojas'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{format.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{format.code}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
