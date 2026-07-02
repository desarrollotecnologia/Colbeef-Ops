import { useEffect, useMemo, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { CheckCircle, ChevronLeft, ChevronRight, Download, XCircle } from 'lucide-react';

import api from '@/lib/api';

import Layout from '@/components/Layout';

import Card, { CardBody } from '@/components/Card';

import Button from '@/components/Button';

import ConfirmDialog from '@/components/ConfirmDialog';

import FormatSubmissionViewer from '@/components/form/FormatSubmissionViewer';

import { useAuth } from '@/context/AuthContext';

import { downloadSubmissionPdf } from '@/lib/downloadPdf';
import { formatWorkDateShort, toWorkDateString } from '@/lib/workDate';

import type { FormSubmission } from '@/types';



export default function AdminReviewPage() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [submission, setSubmission] = useState<FormSubmission | null>(null);

  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  const [showApprove, setShowApprove] = useState(false);

  const [showReject, setShowReject] = useState(false);

  const [rejectNotes, setRejectNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFullLoading, setPdfFullLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);



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



  const sheetDataById = useMemo(() => {

    const map: Record<string, Record<string, unknown>> = {};

    submission?.sheets?.forEach((s) => {

      map[s.sheetId] = (s.data as Record<string, unknown>) ?? {};

    });

    return map;

  }, [submission]);



  if (loading || !submission) {

    return (

      <Layout>

        <div className="flex justify-center py-20">

          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />

        </div>

      </Layout>

    );

  }



  const sheets = submission.format?.sheets ?? [];

  const isPending = submission.status === 'PENDING_REVIEW';

  const workDate = toWorkDateString(submission.workDate);

  const isLastSheet = currentSheetIndex === sheets.length - 1;

  const verificoName =

    submission.reviewedBy?.fullName ?? submission.signature?.admin?.fullName ?? null;

  const canDownloadPdf =

    submission.status === 'APPROVED' || submission.status === 'PENDING_REVIEW';

  const currentSheet = sheets[currentSheetIndex];

  const handleDownloadPdf = async () => {
    if (!currentSheet) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      await downloadSubmissionPdf(submission.id, { sheetId: currentSheet.id });
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'No se pudo descargar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadFullPdf = async () => {
    setPdfFullLoading(true);
    setPdfError(null);
    try {
      await downloadSubmissionPdf(submission.id, { scope: 'all' });
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'No se pudo descargar el PDF completo');
    } finally {
      setPdfFullLoading(false);
    }
  };



  return (

    <Layout>

      <div className="mb-6">

        <h1 className="text-2xl font-bold">{submission.format?.name}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">

          <span>Operario: {submission.operator?.fullName}</span>

          <span>Fecha: {formatWorkDateShort(workDate)}</span>

          <span>{sheets.length} hojas</span>

          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${

            submission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :

            submission.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :

            submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :

            'bg-gray-100 text-gray-700'

          }`}>

            {submission.status}

          </span>

        </div>

        {isPending && (

          <p className="text-xs text-primary-700 mt-2">

            Revise cada hoja con la misma vista del operario. Su nombre aparece en Verificó al aprobar.

          </p>

        )}

      </div>



      <FormatSubmissionViewer

        submission={submission}

        sheets={sheets}

        currentSheetIndex={currentSheetIndex}

        onSheetIndexChange={setCurrentSheetIndex}

        sheetDataById={sheetDataById}

        workDate={workDate}

        operatorName={submission.operator?.fullName ?? ''}

        readOnly

        showSignaturesPerSheet

        verificoName={verificoName}

        pendingVerifierName={isPending ? user?.fullName : undefined}

        status={submission.status}

      />



      {pdfError && (
        <p className="mt-4 text-sm text-red-600">{pdfError}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">

        <div className="flex gap-2">

          <Button

            variant="outline"

            disabled={currentSheetIndex === 0}

            onClick={() => setCurrentSheetIndex((i) => i - 1)}

          >

            <ChevronLeft size={18} /> Hoja anterior

          </Button>

          <Button

            variant="outline"

            disabled={isLastSheet}

            onClick={() => setCurrentSheetIndex((i) => i + 1)}

          >

            Hoja siguiente <ChevronRight size={18} />

          </Button>

        </div>



        <div className="flex flex-wrap gap-3">

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

          {canDownloadPdf && (
            <>
              <Button variant="outline" onClick={handleDownloadPdf} loading={pdfLoading}>
                <Download size={18} /> PDF hoja actual
              </Button>
              {sheets.length > 1 && (
                <Button variant="outline" onClick={handleDownloadFullPdf} loading={pdfFullLoading}>
                  <Download size={18} /> PDF todas las hojas
                </Button>
              )}
            </>
          )}

        </div>

      </div>



      {submission.signature && (

        <Card className="mt-4 border-green-200">

          <CardBody>

            <p className="text-sm text-green-800">

              Firmado el {new Date(submission.signature.signedAt).toLocaleString('es-CO')}

              {verificoName && ` por ${verificoName}`}

            </p>

          </CardBody>

        </Card>

      )}



      <ConfirmDialog

        open={showApprove}

        title="¿Aprobar y firmar este formato?"

        message={`Se registrarán las ${sheets.length} hojas con su nombre como verificador. El documento no podrá modificarse.`}

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


