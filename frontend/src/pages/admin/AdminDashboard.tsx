import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileCheck, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import { formatWorkDateShort, toWorkDateString } from '@/lib/workDate';
import type { FormSubmission, RecentRejection, SubmissionStatus } from '@/types';

const REJECTION_STATUS: Record<SubmissionStatus, { label: string; className: string }> = {
  REJECTED: { label: 'En corrección', className: 'bg-red-100 text-red-800' },
  DRAFT: { label: 'En corrección', className: 'bg-red-100 text-red-800' },
  PENDING_REVIEW: { label: 'Reenviado — pendiente', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Corregido y aprobado', className: 'bg-green-100 text-green-800' },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<FormSubmission[]>([]);
  const [recentApproved, setRecentApproved] = useState<FormSubmission[]>([]);
  const [recentRejected, setRecentRejected] = useState<RecentRejection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/submissions/pending'),
      api.get('/submissions', { params: { status: 'APPROVED' } }),
      api.get<RecentRejection[]>('/submissions/rejected/recent', { params: { limit: 10 } }),
    ]).then(([pendingRes, approvedRes, rejectedRes]) => {
      setPending(pendingRes.data);
      setRecentApproved(approvedRes.data.slice(0, 5));
      setRecentRejected(rejectedRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const inCorrection = recentRejected.filter(
    (r) => r.submission.status === 'REJECTED' || r.submission.status === 'DRAFT'
  ).length;

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
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="text-red-700" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{inCorrection}</p>
              <p className="text-sm text-gray-500">Rechazados en corrección</p>
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
                      <h3 className="font-semibold">
                        {sub.format?.name}
                        {sub.listCliente ? (
                          <span className="text-emerald-800"> — {sub.listCliente}</span>
                        ) : null}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sub.operator?.fullName} — {formatWorkDateShort(toWorkDateString(sub.workDate))}
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

      <section className="mb-8">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <XCircle size={20} /> Rechazados recientemente
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Últimos formatos devueltos y el motivo indicado, para hacer seguimiento a la corrección.
        </p>
        {recentRejected.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 text-gray-500">No hay rechazos registrados</CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentRejected.map((r) => {
              const st = REJECTION_STATUS[r.submission.status];
              return (
                <Link key={r.id} to={`/admin/review/${r.submission.id}`}>
                  <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-400">
                    <CardBody className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {r.submission.format.name}
                          {r.submission.format.documentCode ? (
                            <span className="text-gray-400 font-normal text-sm">
                              {' '}· {r.submission.format.documentCode}
                            </span>
                          ) : null}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {r.submission.operator.fullName} — día{' '}
                          {formatWorkDateShort(toWorkDateString(r.submission.workDate))}
                        </p>
                        <p className="mt-2 text-sm text-gray-800 bg-red-50 border border-red-100 rounded-md px-3 py-2 whitespace-pre-line">
                          <span className="font-semibold text-red-700">Motivo: </span>
                          {r.reason || 'Sin motivo registrado'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Rechazado por {r.rejectedBy?.fullName ?? '—'} · {formatDateTime(r.rejectedAt)}
                        </p>
                      </div>
                      <span
                        className={`self-start shrink-0 text-xs px-3 py-1 rounded-full ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
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
                      <h3 className="font-semibold">
                        {sub.format?.name}
                        {sub.listCliente ? (
                          <span className="text-emerald-800"> — {sub.listCliente}</span>
                        ) : null}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatWorkDateShort(toWorkDateString(sub.workDate))}
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
