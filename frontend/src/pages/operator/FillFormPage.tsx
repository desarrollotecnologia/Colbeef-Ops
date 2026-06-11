import { useEffect, useState, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { ChevronLeft, ChevronRight, Download, Send, Save } from 'lucide-react';

import api from '@/lib/api';

import Layout from '@/components/Layout';

import Button from '@/components/Button';

import ConfirmDialog from '@/components/ConfirmDialog';

import FormatSubmissionViewer from '@/components/form/FormatSubmissionViewer';

import { useAuth } from '@/context/AuthContext';

import { applyAutoFields, recalcDependentFields } from '@/lib/autoFill';

import { formatWorkDateShort, getWorkDateString, toWorkDateString } from '@/lib/workDate';

import { downloadSubmissionPdf } from '@/lib/downloadPdf';
import { getIncompleteFields, isSheetComplete } from '@/lib/sheetCompletion';

import type { FormSubmission, FormatField, MissingField } from '@/types';



export default function FillFormPage() {

  const { id, formatId } = useParams<{ id?: string; formatId?: string }>();

  const navigate = useNavigate();

  const { user } = useAuth();

  const isNew = !!formatId;



  const [submission, setSubmission] = useState<FormSubmission | null>(null);

  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

  const [formData, setFormData] = useState<Record<string, Record<string, unknown>>>({});

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);



  const getEffectiveWorkDate = useCallback(

    (sub: FormSubmission | null, editable: boolean) => {

      if (editable || !sub?.workDate) return getWorkDateString();

      return toWorkDateString(sub.workDate);

    },

    []

  );



  const initSheetData = useCallback(

    (fields: FormatField[], existing: Record<string, unknown>, dateStr: string) => {

      return applyAutoFields(fields, existing, {

        workDate: dateStr,

        userName: user?.fullName ?? '',

        sheetData: existing,

      });

    },

    [user?.fullName]

  );



  useEffect(() => {

    async function init() {

      if (isNew && formatId) {

        const { data } = await api.post('/submissions', { formatId });

        navigate(`/submissions/${data.id}`, { replace: true });

        return;

      }



      if (!id) return;



      const { data } = await api.get(`/submissions/${id}`);

      setSubmission(data);



      const editable = data.status === 'DRAFT' || data.status === 'REJECTED';

      const dateStr = getEffectiveWorkDate(data, editable);



      const initial: Record<string, Record<string, unknown>> = {};

      data.sheets?.forEach((s: { sheetId: string; data: Record<string, unknown> }) => {

        const sheetDef = data.format?.sheets?.find((sh: { id: string }) => sh.id === s.sheetId);

        const fields = sheetDef?.fields ?? [];

        initial[s.sheetId] = applyAutoFields(fields, s.data || {}, {

          workDate: dateStr,

          userName: user?.fullName ?? '',

          sheetData: s.data || {},

        });

      });

      setFormData(initial);

      setLoading(false);

    }



    init().catch(() => setLoading(false));

  }, [id, isNew, formatId, navigate, getEffectiveWorkDate, user?.fullName]);



  if (loading || !submission) {

    return (

      <Layout>

        <div className="flex justify-center py-20">

          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />

        </div>

      </Layout>

    );

  }



  const sheets = submission.format?.sheets || [];

  const currentSheet = sheets[currentSheetIndex];

  const fields = currentSheet?.fields || [];

  const canEdit = submission.status === 'DRAFT' || submission.status === 'REJECTED';

  const effectiveWorkDate = getEffectiveWorkDate(submission, canEdit);

  const isLastSheet = currentSheetIndex === sheets.length - 1;

  const operatorName = submission.operator?.fullName ?? user?.fullName ?? '';



  const updateField = (fieldKey: string, value: unknown) => {

    if (!currentSheet) return;

    setFormData((prev) => {

      let updated = { ...prev[currentSheet.id], [fieldKey]: value };

      updated = recalcDependentFields(fields, updated, {

        workDate: effectiveWorkDate,

        userName: user?.fullName ?? '',

        sheetData: updated,

      }, fieldKey);

      return { ...prev, [currentSheet.id]: updated };

    });

    setMissingFields([]);

  };



  const saveSheet = async (sheetId: string, sheetFields: FormatField[]) => {

    const dataToSave = initSheetData(sheetFields, formData[sheetId] || {}, effectiveWorkDate);

    await api.put(`/submissions/${submission.id}/sheets/${sheetId}`, { data: dataToSave });

    setFormData((prev) => ({ ...prev, [sheetId]: dataToSave }));

  };



  const saveCurrentSheet = async () => {

    if (!currentSheet) return;

    setSaving(true);

    setSaveMessage(null);

    try {

      await saveSheet(currentSheet.id, fields);

      setSaveMessage(`Hoja "${currentSheet.name}" guardada correctamente.`);

    } catch {

      setSaveMessage('No se pudo guardar. Verifique su conexión e intente de nuevo.');

    } finally {

      setSaving(false);

    }

  };



  const handleDownloadPdf = async () => {

    setPdfLoading(true);

    try {

      await downloadSubmissionPdf(submission.id);

    } catch (err) {

      setSaveMessage(err instanceof Error ? err.message : 'No se pudo descargar el PDF.');

    } finally {

      setPdfLoading(false);

    }

  };



  const saveAllSheets = async () => {

    setSaving(true);

    try {

      for (const sheet of sheets) {

        const sheetFields = sheet.fields ?? [];

        await saveSheet(sheet.id, sheetFields);

      }

    } finally {

      setSaving(false);

    }

  };



  const handleSubmit = async () => {

    const allMissing = sheets.flatMap((sheet) =>

      getIncompleteFields(sheet.fields ?? [], formData[sheet.id] ?? {}, effectiveWorkDate, sheet.name)

    );



    if (allMissing.length > 0) {

      setMissingFields(allMissing);

      setShowSubmitConfirm(false);

      return;

    }



    await saveAllSheets();

    try {

      await api.post(`/submissions/${submission.id}/submit`);

      navigate('/submissions');

    } catch (err: unknown) {

      const error = err as { response?: { data?: { missingFields?: MissingField[] } } };

      if (error.response?.data?.missingFields) {

        setMissingFields(error.response.data.missingFields);

      }

      setShowSubmitConfirm(false);

    }

  };



  return (

    <Layout>

      <div className="mb-4">

        <h1 className="text-xl sm:text-2xl font-bold">{submission.format?.name}</h1>

        <p className="text-gray-500 text-sm">

          Hoja {currentSheetIndex + 1} de {sheets.length}: {currentSheet?.name}

          {' · '}

          Fecha: {formatWorkDateShort(effectiveWorkDate)}

        </p>

        {canEdit && (

          <p className="text-xs text-amber-700 mt-1">

            Debe completar las {sheets.length} hojas del formato antes de entregar a revisión.

          </p>

        )}

        {submission.status === 'REJECTED' && submission.reviewNotes && (

          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800">

            <strong>Rechazado:</strong> {submission.reviewNotes}

          </div>

        )}

      </div>



      {missingFields.length > 0 && (

        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">

          <h3 className="font-semibold text-red-800 mb-2">

            Complete todas las hojas antes de entregar. Pendientes:

          </h3>

          <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">

            {missingFields.map((f, i) => (

              <li key={i}>

                <strong>{f.sheet}</strong> → {f.label}

              </li>

            ))}

          </ul>

        </div>

      )}



      <FormatSubmissionViewer

        submission={submission}

        sheets={sheets}

        currentSheetIndex={currentSheetIndex}

        onSheetIndexChange={setCurrentSheetIndex}

        sheetDataById={formData}

        workDate={effectiveWorkDate}

        operatorName={operatorName}

        readOnly={!canEdit}

        onFieldUpdate={updateField}

        onBeforeSheetChange={canEdit ? saveCurrentSheet : undefined}

        showSignaturesPerSheet={isLastSheet}

        verificoName={submission.reviewedBy?.fullName}

        status={submission.status}

        sheetTabExtra={(sheet) => {

          const complete = isSheetComplete(sheet.fields ?? [], formData[sheet.id] ?? {}, effectiveWorkDate);

          return (

            <span

              className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-green-500' : 'bg-amber-400'}`}

              title={complete ? 'Hoja completa' : 'Hoja incompleta'}

            />

          );

        }}

      />



      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">

        <div className="flex gap-2">

          <Button

            variant="outline"

            disabled={currentSheetIndex === 0}

            onClick={async () => {

              if (canEdit) await saveCurrentSheet();

              setCurrentSheetIndex((i) => i - 1);

            }}

          >

            <ChevronLeft size={18} /> Anterior

          </Button>

          <Button

            variant="outline"

            disabled={isLastSheet}

            onClick={async () => {

              if (canEdit) await saveCurrentSheet();

              setCurrentSheetIndex((i) => i + 1);

            }}

          >

            Siguiente <ChevronRight size={18} />

          </Button>

        </div>



        <div className="flex flex-wrap items-center gap-2">

          {canEdit && (

            <>

              <Button variant="secondary" onClick={saveCurrentSheet} loading={saving}>

                <Save size={18} /> Guardar hoja

              </Button>

              {isLastSheet && (

                <Button onClick={() => setShowSubmitConfirm(true)}>

                  <Send size={18} /> Entregar formato completo

                </Button>

              )}

            </>

          )}

          {submission.status === 'APPROVED' && (

            <Button variant="outline" onClick={handleDownloadPdf} loading={pdfLoading}>

              <Download size={18} /> Descargar PDF

            </Button>

          )}

        </div>

      </div>



      {saveMessage && (

        <p className={`mt-3 text-sm ${saveMessage.includes('No se') ? 'text-red-600' : 'text-green-700'}`}>

          {saveMessage}

        </p>

      )}



      <ConfirmDialog

        open={showSubmitConfirm}

        title="¿Entregar formato completo?"

        message={`Se enviarán las ${sheets.length} hojas a revisión del jefe de área. Verifique que todas estén completas. No podrá editar hasta que sea revisado.`}

        confirmLabel="Sí, entregar todo"

        onConfirm={handleSubmit}

        onCancel={() => setShowSubmitConfirm(false)}

      />

    </Layout>

  );

}


