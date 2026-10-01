import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { INPUT_CLASS } from '@/lib/formUtils';
import { formatChangeDate } from './AdminChangeControlPage';
import type { ChangeControlModule, ChangeLogEntry } from '@/types';

type Draft = {
  version: string;
  changeDate: string;
  elaboro: string;
  reviso: string;
  aprobo: string;
  descripcion: string;
};

const EMPTY_DRAFT: Draft = {
  version: '',
  changeDate: '',
  elaboro: '',
  reviso: '',
  aprobo: '',
  descripcion: '',
};

function toDraft(e: ChangeLogEntry): Draft {
  return {
    version: e.version,
    changeDate: e.changeDate ? e.changeDate.slice(0, 10) : '',
    elaboro: e.elaboro ?? '',
    reviso: e.reviso ?? '',
    aprobo: e.aprobo ?? '',
    descripcion: e.descripcion ?? '',
  };
}

function nextVersion(entries: ChangeLogEntry[]): string {
  const last = entries[entries.length - 1]?.version ?? '';
  const n = Number.parseInt(last, 10);
  if (Number.isNaN(n)) return '';
  return String(n + 1).padStart(2, '0');
}

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } } };
  return e.response?.data?.error ?? 'No se pudo guardar el cambio';
}

const COLS = ['Versión', 'Fecha', 'Elaboró', 'Revisó', 'Aprobó', 'Descripción', ''];

export default function AdminChangeControlDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [module, setModule] = useState<ChangeControlModule | null>(null);
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<ChangeLogEntry | null>(null);

  useEffect(() => {
    api
      .get<{ module: ChangeControlModule; entries: ChangeLogEntry[] }>(`/admin/change-control/${code}`)
      .then(({ data }) => {
        setModule(data.module);
        setEntries(data.entries);
      })
      .finally(() => setLoading(false));
  }, [code]);

  const startEdit = (entry: ChangeLogEntry) => {
    setEditingId(entry.id);
    setDraft(toDraft(entry));
    setError('');
  };

  const startNew = () => {
    setEditingId('new');
    setDraft({ ...EMPTY_DRAFT, version: nextVersion(entries) });
    setError('');
  };

  const cancel = () => {
    setEditingId(null);
    setError('');
  };

  const save = async () => {
    if (!draft.version.trim()) {
      setError('La versión es obligatoria');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId === 'new') {
        const { data } = await api.post<ChangeLogEntry>(`/admin/change-control/${code}`, draft);
        setEntries((prev) => [...prev, data]);
      } else if (editingId) {
        const { data } = await api.patch<ChangeLogEntry>(`/admin/change-control/entries/${editingId}`, draft);
        setEntries((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      }
      setEditingId(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    try {
      await api.delete(`/admin/change-control/entries/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const editRow = (key: string) => (
    <tr key={key} className="bg-primary-50/40 align-top">
      <td className="border border-gray-200 p-1.5">
        <input className={`${INPUT_CLASS} text-sm`} value={draft.version} onChange={set('version')} placeholder="01" />
      </td>
      <td className="border border-gray-200 p-1.5">
        <input type="date" className={`${INPUT_CLASS} text-sm`} value={draft.changeDate} onChange={set('changeDate')} />
      </td>
      <td className="border border-gray-200 p-1.5">
        <input className={`${INPUT_CLASS} text-sm`} value={draft.elaboro} onChange={set('elaboro')} />
      </td>
      <td className="border border-gray-200 p-1.5">
        <input className={`${INPUT_CLASS} text-sm`} value={draft.reviso} onChange={set('reviso')} />
      </td>
      <td className="border border-gray-200 p-1.5">
        <input className={`${INPUT_CLASS} text-sm`} value={draft.aprobo} onChange={set('aprobo')} />
      </td>
      <td className="border border-gray-200 p-1.5">
        <textarea
          className={`${INPUT_CLASS} text-sm min-h-[64px]`}
          value={draft.descripcion}
          onChange={set('descripcion')}
          placeholder="Describa el cambio de estructura del formato…"
        />
      </td>
      <td className="border border-gray-200 p-1.5">
        <div className="flex flex-col gap-1">
          <Button size="sm" onClick={save} loading={saving}>
            <Save size={14} /> Guardar
          </Button>
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!module) {
    return (
      <Layout>
        <p className="text-gray-500">Formato no encontrado.</p>
        <Link to="/admin/control-cambios" className="text-primary-600 hover:underline text-sm">
          Volver a Control de cambios
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link
        to="/admin/control-cambios"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-4"
      >
        <ArrowLeft size={16} /> Control de cambios
      </Link>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
          <p className="text-gray-500 mt-1">
            {module.documentCode || module.code} · Control de cambios
          </p>
        </div>
        <Button onClick={startNew} disabled={editingId !== null}>
          <Plus size={16} /> Agregar cambio
        </Button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
      )}

      <Card className="overflow-hidden">
        <div className="bg-primary-700 text-white text-center font-bold tracking-wide py-2 text-sm">
          CONTROL DE CAMBIOS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-primary-50 text-gray-700">
                {COLS.map((c, i) => (
                  <th
                    key={i}
                    className={`border border-gray-200 px-3 py-2 text-left font-semibold ${
                      i === 0 ? 'w-20' : i === 1 ? 'w-36' : i === 5 ? 'min-w-[260px]' : i === 6 ? 'w-28' : ''
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) =>
                editingId === e.id ? (
                  editRow(e.id)
                ) : (
                  <tr key={e.id} className="align-top hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-semibold">{e.version}</td>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">{formatChangeDate(e.changeDate)}</td>
                    <td className="border border-gray-200 px-3 py-2">{e.elaboro || '—'}</td>
                    <td className="border border-gray-200 px-3 py-2">{e.reviso || '—'}</td>
                    <td className="border border-gray-200 px-3 py-2">{e.aprobo || '—'}</td>
                    <td className="border border-gray-200 px-3 py-2 whitespace-pre-line">
                      {e.descripcion || <span className="text-gray-400">Sin descripción</span>}
                      {e.updatedBy && (
                        <span className="block text-[11px] text-gray-400 mt-1">
                          Editado por {e.updatedBy.fullName} ·{' '}
                          {new Date(e.updatedAt).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          title="Editar"
                          disabled={editingId !== null}
                          onClick={() => startEdit(e)}
                          className="p-1.5 text-primary-700 hover:bg-primary-50 rounded disabled:opacity-40"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          disabled={editingId !== null}
                          onClick={() => setToDelete(e)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {editingId === 'new' && editRow('new')}
              {entries.length === 0 && editingId !== 'new' && (
                <tr>
                  <td colSpan={COLS.length} className="text-center text-gray-500 py-8">
                    Este formato aún no tiene registros de control de cambios. Use «Agregar cambio» para crear el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar registro"
        message={`¿Eliminar la versión ${toDelete?.version ?? ''} del control de cambios? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Layout>
  );
}
