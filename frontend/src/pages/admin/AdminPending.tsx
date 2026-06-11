import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import { formatWorkDateShort, toWorkDateString } from '@/lib/workDate';
import type { FormSubmission } from '@/types';

export default function AdminPending() {
  const [pending, setPending] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/submissions/pending').then(({ data }) => setPending(data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Formatos pendientes</h1>
        <p className="text-gray-500 mt-1">Revise y firme los formatos entregados por los operarios</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-gray-500">
            No hay formatos pendientes de revisión
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((sub) => (
            <Link key={sub.id} to={`/admin/review/${sub.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{sub.format?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Operario: {sub.operator?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Fecha del turno: {formatWorkDateShort(toWorkDateString(sub.workDate))}
                    </p>
                    <p className="text-sm text-gray-500">
                      Entregado: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('es-CO') : '-'}
                    </p>
                  </div>
                  <span className="self-start sm:self-center text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium">
                    Revisar y firmar
                  </span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
