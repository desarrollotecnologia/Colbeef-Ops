import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import type { FormSubmission } from '@/types';

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING_REVIEW: { label: 'Pendiente revisión', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  APPROVED: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function OperatorSubmissions() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/submissions').then(({ data }) => setSubmissions(data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis envíos</h1>
        <p className="text-gray-500 mt-1">Historial de formatos llenados</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-gray-500">
            No tiene envíos registrados aún
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const cfg = statusConfig[sub.status];
            const Icon = cfg.icon;
            return (
              <Link key={sub.id} to={`/submissions/${sub.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{sub.format?.name}</h3>
                      <p className="text-sm text-gray-500">
                        Fecha: {new Date(sub.workDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${cfg.color}`}>
                      <Icon size={14} />
                      {cfg.label}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
