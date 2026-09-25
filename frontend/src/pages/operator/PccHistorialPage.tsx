import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, History } from 'lucide-react';
import axios from 'axios';
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

function cumpleLabel(v: boolean) {
  return v ? 'Cumple' : 'No cumple';
}

function CumpleBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full font-semibold text-xs ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {label}: {ok ? 'Cumple' : 'No'}
    </span>
  );
}

export default function PccHistorialPage() {
  const [fecha, setFecha] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fechaOperativa, setFechaOperativa] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const load = async (opts?: { fecha?: string; page?: number }) => {
    const f = opts?.fecha ?? fecha;
    const p = opts?.page ?? page;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page: p };
      if (f) params.fecha = f;
      const { data } = await api.get('/pcc/historial', { params });
      setRegistros(data.registros);
      setFechaOperativa(data.fechaOperativa);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
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
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = () => {
    setPage(1);
    load({ fecha, page: 1 });
  };

  const goPage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    load({ fecha, page: next });
  };

  const downloadExcel = async () => {
    setDownloading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (fecha) params.fecha = fecha;
      const response = await api.get('/pcc/historial/excel', {
        params,
        responseType: 'blob',
      });

      const blobData = response.data as Blob;
      if (blobData.type?.includes('json') || blobData.size < 50) {
        const text = await blobData.text();
        try {
          const parsed = JSON.parse(text) as { error?: string };
          throw new Error(parsed.error || 'No se pudo generar el Excel');
        } catch (e) {
          if (e instanceof Error && e.message !== 'No se pudo generar el Excel') {
            throw new Error('No se pudo generar el Excel');
          }
          throw e;
        }
      }

      const disposition = response.headers['content-disposition'] as string | undefined;
      let filename = `verificacion-pcc_historial_${(fecha || fechaOperativa).replace(/-/g, '')}.xlsx`;
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      if (match?.[1]) filename = match[1];

      const blob = new Blob([blobData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text) as { error?: string };
          setError(parsed.error || 'No se pudo descargar el Excel');
        } catch {
          setError('No se pudo descargar el Excel');
        }
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo descargar el Excel');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History size={26} /> Historial PCC
          </h1>
          <p className="text-gray-500 mt-1">
            Día operativo: <strong>{fechaOperativa || '—'}</strong>
            {total > 0 && (
              <span className="ml-2 text-sm">
                · {total} registro{total === 1 ? '' : 's'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadExcel} loading={downloading} disabled={!fecha && !fechaOperativa}>
            <Download size={16} /> Descargar Excel
          </Button>
          <Link to="/pcc">
            <Button variant="outline">
              <ArrowLeft size={16} /> Volver a cola
            </Button>
          </Link>
        </div>
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
          <Button onClick={handleFiltrar} loading={loading}>
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
        <>
          {/* Móvil: tarjetas */}
          <div className="space-y-3 md:hidden">
            {registros.map((r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{r.idProducto}</h3>
                      <p className="text-sm text-gray-500">
                        {r.propietario || '—'} ·{' '}
                        {new Date(r.createdAt).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Verificado por: {r.user.fullName}
                      </p>
                      {r.responsablePuesto && (
                        <p className="text-xs text-gray-500">Responsable: {r.responsablePuesto}</p>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <CumpleBadge label="MC1" ok={r.cumpleMediaCanal1} />
                      <CumpleBadge label="MC2" ok={r.cumpleMediaCanal2} />
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

          {/* Escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">ID producto</th>
                  <th className="px-4 py-3 font-semibold">Propietario</th>
                  <th className="px-4 py-3 font-semibold">MC1</th>
                  <th className="px-4 py-3 font-semibold">MC2</th>
                  <th className="px-4 py-3 font-semibold">Responsable</th>
                  <th className="px-4 py-3 font-semibold">Observación</th>
                  <th className="px-4 py-3 font-semibold">Acción correctiva</th>
                  <th className="px-4 py-3 font-semibold">Verificado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(r.createdAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.idProducto}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {r.propietario || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.cumpleMediaCanal1 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
                        }
                      >
                        {cumpleLabel(r.cumpleMediaCanal1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.cumpleMediaCanal2 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
                        }
                      >
                        {cumpleLabel(r.cumpleMediaCanal2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.responsablePuesto || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {r.observacion || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                      {r.accionCorrectiva || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.user.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages} · 20 por página
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => goPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => goPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
