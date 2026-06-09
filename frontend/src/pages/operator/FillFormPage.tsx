import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { FormSubmission, MissingField } from '@/types';

export default function FillFormPage() {
  const { id, formatId } = useParams<{ id?: string; formatId?: string }>();
  const navigate = useNavigate();
  const isNew = !!formatId;

  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const workDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function init() {
      if (isNew && formatId) {
        const { data } = await api.post('/submissions', { formatId, workDate });
        navigate(`/submissions/${data.id}`, { replace: true });
        return;
      }

      if (!id) return;

      const { data } = await api.get(`/submissions/${id}`);
      setSubmission(data);

      const initial: Record<string, Record<string, unknown>> = {};
      data.sheets?.forEach((s: { sheetId: string; data: Record<string, unknown> }) => {
        initial[s.sheetId] = s.data || {};
      });
      setFormData(initial);
      setLoading(false);
    }

    init().catch(() => setLoading(false));
  }, [id, isNew, formatId, navigate, workDate]);

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
  const formatSheet = submission.format?.sheets?.find((s) => s.id === currentSheet?.id);
  const fields = formatSheet?.fields || [];
  const canEdit = submission.status === 'DRAFT' || submission.status === 'REJECTED';

  const updateField = (fieldKey: string, value: unknown) => {
    if (!currentSheet) return;
    setFormData((prev) => ({
      ...prev,
      [currentSheet.id]: { ...prev[currentSheet.id], [fieldKey]: value },
    }));
  };

  const saveCurrentSheet = async () => {
    if (!currentSheet) return;
    setSaving(true);
    try {
      await api.put(`/submissions/${submission.id}/sheets/${currentSheet.id}`, {
        data: formData[currentSheet.id] || {},
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await saveCurrentSheet();
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
        </p>
      </div>

      {/* Navegación de hojas */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {sheets.map((sheet, idx) => (
          <button
            key={sheet.id}
            onClick={async () => {
              if (canEdit) await saveCurrentSheet();
              setCurrentSheetIndex(idx);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              idx === currentSheetIndex
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      {missingFields.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Campos obligatorios pendientes:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {missingFields.map((f, i) => (
              <li key={i}>
                <strong>{f.sheet}</strong> → {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-lg">{currentSheet?.name}</h2>
        </CardHeader>
        <CardBody>
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Los campos de esta hoja se configurarán cuando recibamos el formato.
              <br />
              <span className="text-sm">(Placeholder — pendiente de definir campos)</span>
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={(formData[currentSheet!.id]?.[field.fieldKey] as string) || ''}
                    onChange={(e) => updateField(field.fieldKey, e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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
            disabled={currentSheetIndex === sheets.length - 1}
            onClick={async () => {
              if (canEdit) await saveCurrentSheet();
              setCurrentSheetIndex((i) => i + 1);
            }}
          >
            Siguiente <ChevronRight size={18} />
          </Button>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveCurrentSheet} loading={saving}>
              <Save size={18} /> Guardar
            </Button>
            <Button onClick={() => setShowSubmitConfirm(true)}>
              <Send size={18} /> Entregar formatos
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        title="¿Entregar formatos del día?"
        message="Una vez entregados, no podrá editarlos hasta que el jefe de área los revise. ¿Está seguro de que completó todos los campos?"
        confirmLabel="Sí, entregar"
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </Layout>
  );
}
