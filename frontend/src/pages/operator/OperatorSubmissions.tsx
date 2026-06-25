import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, Download } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';
import { downloadSubmissionPdf } from '@/lib/downloadPdf';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatWorkDateShort, getWorkDateString, toWorkDateString } from '@/lib/workDate';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const loadSubmissions = () => {
    setLoading(true);
    api.get('/submissions').then(({ data }) => setSubmissions(data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await api.delete(`/submissions/${deleteTarget.id}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  const today = getWorkDateString();

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
            const workDateStr = toWorkDateString(sub.workDate);
            const isOldDraft = sub.status === 'DRAFT' && workDateStr !== today;

            return (
              <Card key={sub.id} className="hover:shadow-md transition-shadow">
                <CardBody className="flex items-center justify-between gap-4">
                  <Link to={`/submissions/${sub.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold">{sub.format?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Fecha: {formatWorkDateShort(workDateStr)}
                      {isOldDraft && (
                        <span className="ml-2 text-amber-600 font-medium">· Borrador anterior</span>
                      )}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${cfg.color}`}>
                      <Icon size={14} />
                      {cfg.label}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        loading={pdfLoadingId === sub.id}
                        onClick={async (e) => {
                          e.preventDefault();
                          setPdfLoadingId(sub.id);
                          try {
                            await downloadSubmissionPdf(sub.id);
                          } finally {
                            setPdfLoadingId(null);
                          }
                        }}
                      >
                        <Download size={16} /> PDF
                      </Button>
                    {sub.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sub)}
                        disabled={deletingId === sub.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar borrador"
                        aria-label="Eliminar borrador"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="¿Eliminar borrador?"
        message={
          deleteTarget
            ? `Se eliminará el borrador de "${deleteTarget.format?.name}" (${formatWorkDateShort(toWorkDateString(deleteTarget.workDate))}). Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
