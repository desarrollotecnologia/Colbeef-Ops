import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Download } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { FormSubmission } from '@/types';

export default function AdminReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get(`/submissions/${id}`).then(({ data }) => setSubmission(data)).finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/submissions/${id}/approve`, { notes: 'Aprobado y firmado' });
      navigate('/admin');
    } finally {
      setActionLoading(false);
      setShowApprove(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/submissions/${id}/reject`, { notes: rejectNotes });
      navigate('/admin');
    } finally {
      setActionLoading(false);
      setShowReject(false);
    }
  };

  if (loading || !submission) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const isPending = submission.status === 'PENDING_REVIEW';

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{submission.format?.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
          <span>Operario: {submission.operator?.fullName}</span>
          <span>Fecha: {new Date(submission.workDate).toLocaleDateString('es-CO')}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            submission.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
            submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-700'
          }`}>
            {submission.status}
          </span>
        </div>
      </div>

      {submission.sheets?.map((sheet) => (
        <Card key={sheet.id} className="mb-4">
          <CardHeader>
            <h2 className="font-semibold">{sheet.sheet?.name}</h2>
          </CardHeader>
          <CardBody>
            {Object.keys(sheet.data || {}).length === 0 ? (
              <p className="text-gray-500 text-sm">Sin datos registrados en esta hoja</p>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(sheet.data as Record<string, unknown>).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-gray-500 uppercase">{key}</dt>
                    <dd className="text-sm font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardBody>
        </Card>
      ))}

      {submission.signature && (
        <Card className="mb-4 border-green-200">
          <CardBody>
            <p className="text-sm text-green-800">
              Firmado el {new Date(submission.signature.signedAt).toLocaleString('es-CO')}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        {isPending && (
          <>
            <Button onClick={() => setShowApprove(true)}>
              <CheckCircle size={18} /> Aprobar y firmar
            </Button>
            <Button variant="danger" onClick={() => setShowReject(true)}>
              <XCircle size={18} /> Rechazar
            </Button>
          </>
        )}
        {submission.status === 'APPROVED' && (
          <Button variant="outline" disabled title="PDF — próximamente">
            <Download size={18} /> Descargar PDF
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showApprove}
        title="¿Aprobar y firmar este formato?"
        message="Al aprobar, el documento quedará registrado en la base de datos y no podrá modificarse."
        confirmLabel="Aprobar y firmar"
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowReject(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold">Rechazar formato</h3>
            <p className="text-gray-600 mt-2 text-sm">Indique el motivo para que el operario pueda corregir:</p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              rows={3}
              placeholder="Motivo del rechazo..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancelar</Button>
              <Button variant="danger" onClick={handleReject} loading={actionLoading} disabled={!rejectNotes.trim()}>
                Rechazar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
