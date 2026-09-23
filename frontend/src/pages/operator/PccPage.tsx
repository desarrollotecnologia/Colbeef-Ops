import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, History, Save } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

type Cumple = boolean | null;

type Actual = {
  externalInsId: string;
  idProducto: string;
  propietario: string;
  snapshot: unknown;
} | null;

type ColaResponse = {
  fechaOperativa: string;
  trazabilidadConfigured: boolean;
  total: number;
  verificados: number;
  pendientes: number;
  actual: Actual;
  message?: string | null;
};

function CumpleToggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Cumple;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
      <div className="flex gap-2">
        {[
          { v: true, text: 'Cumple' },
          { v: false, text: 'No cumple' },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.v)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              value === opt.v
                ? opt.v
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-red-600 text-white border-red-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PccPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cola, setCola] = useState<ColaResponse | null>(null);
  const [mc1, setMc1] = useState<Cumple>(null);
  const [mc2, setMc2] = useState<Cumple>(null);
  const [observacion, setObservacion] = useState('');
  const [accionCorrectiva, setAccionCorrectiva] = useState('');

  const resetForm = () => {
    setMc1(null);
    setMc2(null);
    setObservacion('');
    setAccionCorrectiva('');
  };

  const loadCola = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<ColaResponse>('/pcc/cola');
      setCola(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar la cola PCC';
      setError(msg);
      setCola(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCola();
  }, [loadCola]);

  const handleSave = async () => {
    if (!cola?.actual) return;
    if (mc1 === null || mc2 === null) {
      setError('Indique cumplimiento de media canal 1 y 2');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/pcc/verificar', {
        externalInsId: cola.actual.externalInsId,
        idProducto: cola.actual.idProducto,
        snapshot: cola.actual.snapshot,
        cumpleMediaCanal1: mc1,
        cumpleMediaCanal2: mc2,
        observacion,
        accionCorrectiva,
      });
      setSuccess('Verificación guardada');
      resetForm();
      setCola({
        fechaOperativa: data.fechaOperativa,
        trazabilidadConfigured: true,
        total: data.total,
        verificados: data.verificados,
        pendientes: data.pendientes,
        actual: data.actual,
        message: data.message,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck size={26} /> Verificación PCC
          </h1>
          <p className="text-gray-500 mt-1">
            Liberación de canales · día operativo{' '}
            <strong>{cola?.fechaOperativa ?? '—'}</strong>
          </p>
        </div>
        <Link to="/pcc/historial">
          <Button variant="outline">
            <History size={16} /> Historial
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total turno', value: cola?.total ?? 0 },
              { label: 'Verificados', value: cola?.verificados ?? 0 },
              { label: 'Pendientes', value: cola?.pendientes ?? 0 },
            ].map((c) => (
              <Card key={c.label}>
                <CardBody className="py-3 text-center">
                  <p className="text-2xl font-bold text-primary-800">{c.value}</p>
                  <p className="text-xs text-gray-500">{c.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 text-green-800 px-4 py-3 text-sm">{success}</div>
          )}
          {cola?.message && (
            <div className="mb-4 rounded-lg bg-amber-50 text-amber-900 px-4 py-3 text-sm">
              {cola.message}
            </div>
          )}

          {cola?.actual ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">ID producto</p>
                  <p className="text-xl font-bold text-gray-900">{cola.actual.idProducto}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Propietario: <strong>{cola.actual.propietario}</strong>
                  </p>
                </div>

                <CumpleToggle label="Media canal 1" value={mc1} onChange={setMc1} disabled={saving} />
                <CumpleToggle label="Media canal 2" value={mc2} onChange={setMc2} disabled={saving} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[72px]"
                    disabled={saving}
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    maxLength={5000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acción correctiva
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[72px]"
                    disabled={saving}
                    value={accionCorrectiva}
                    onChange={(e) => setAccionCorrectiva(e.target.value)}
                    maxLength={5000}
                  />
                </div>

                <Button
                  className="w-full"
                  loading={saving}
                  disabled={mc1 === null || mc2 === null}
                  onClick={handleSave}
                >
                  <Save size={16} /> Guardar y pasar al siguiente
                </Button>
              </CardBody>
            </Card>
          ) : (
            !cola?.message && (
              <Card>
                <CardBody className="text-center py-12 text-gray-500">
                  No hay producto pendiente para verificar.
                </CardBody>
              </Card>
            )
          )}
        </>
      )}
    </Layout>
  );
}
