import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileCheck, Clock } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import type { FormSubmission } from '@/types';

export default function AdminDashboard() {
  const [pending, setPending] = useState<FormSubmission[]>([]);
  const [recentApproved, setRecentApproved] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/submissions/pending'),
      api.get('/submissions', { params: { status: 'APPROVED' } }),
    ]).then(([pendingRes, approvedRes]) => {
      setPending(pendingRes.data);
      setRecentApproved(approvedRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
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
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-gray-500 mt-1">Revise y firme los formatos entregados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-700" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-sm text-gray-500">Pendientes de revisión</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck size={20} /> Pendientes de revisión
          </h2>
          <Link to="/admin/pending" className="text-sm text-primary-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {pending.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 text-gray-500">
              No hay formatos pendientes de revisión
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((sub) => (
              <Link key={sub.id} to={`/admin/review/${sub.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.format?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {sub.operator?.fullName} — {new Date(sub.workDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                      Revisar
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <FileCheck size={20} /> Recientemente aprobados
        </h2>
        {recentApproved.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 text-gray-500">Sin registros aún</CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentApproved.map((sub) => (
              <Link key={sub.id} to={`/admin/review/${sub.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.format?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(sub.workDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Aprobado
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
