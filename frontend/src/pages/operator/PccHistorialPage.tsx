import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

type Registro = {
  id: string;
  idProducto: string;
  externalInsId: string;
  cumpleMediaCanal1: boolean;
  cumpleMediaCanal2: boolean;
  observacion: string | null;
  accionCorrectiva: string | null;
  responsablePuesto: string | null;
  propietario: string | null;
  createdAt: string;
  user: { fullName: string };
};

export default function PccHistorialPage() {
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fechaOperativa, setFechaOperativa] = useState('');
  const [error, setError] = useState('');

  const load = async (f?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = f ? { fecha: f } : {};
      const { data } = await api.get('/pcc/historial', { params });
      setRegistros(data.registros);
      setFechaOperativa(data.fechaOperativa);
      if (!fecha) setFecha(data.fechaOperativa);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo cargar el historial';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History size={26} /> Historial PCC
          </h1>
          <p className="text-gray-500 mt-1">
            Día operativo: <strong>{fechaOperativa || '—'}</strong>
          </p>
        </div>
        <Link to="/pcc">
          <Button variant="outline">
            <ArrowLeft size={16} /> Volver a cola
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <CardBody className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha operativa</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <Button onClick={() => load(fecha)} loading={loading}>
            Filtrar
          </Button>
        </CardBody>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : registros.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-gray-500">
            Sin verificaciones para esa fecha
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {registros.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg">{r.idProducto}</h3>
                    <p className="text-sm text-gray-500">
                      {r.propietario || '—'} · {new Date(r.createdAt).toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Registró: {r.user.fullName}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        r.cumpleMediaCanal1
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      MC1: {r.cumpleMediaCanal1 ? 'Cumple' : 'No'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        r.cumpleMediaCanal2
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      MC2: {r.cumpleMediaCanal2 ? 'Cumple' : 'No'}
                    </span>
                  </div>
                </div>
                {(r.observacion || r.accionCorrectiva) && (
                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    {r.observacion && <p>Obs: {r.observacion}</p>}
                    {r.accionCorrectiva && <p>AC: {r.accionCorrectiva}</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
