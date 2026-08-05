import { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/Button';
import type { FormSubmission, UserBrief } from '@/types';

interface Props {
  submission: FormSubmission;
  isOwner: boolean;
  canManage: boolean;
  onUpdated: (submission: FormSubmission) => void;
}

export default function CollaborationPanel({ submission, isOwner, canManage, onUpdated }: Props) {
  const [candidates, setCandidates] = useState<UserBrief[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCandidates = async () => {
    if (!canManage || !submission.id) return;
    try {
      const { data } = await api.get<UserBrief[]>(`/submissions/${submission.id}/collaborator-candidates`);
      setCandidates(data);
    } catch {
      setCandidates([]);
    }
  };

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission.id, submission.collaborators?.length]);

  const addCollaborator = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<FormSubmission>(`/submissions/${submission.id}/collaborators`, {
        userId: selectedId,
      });
      onUpdated(data);
      setSelectedId('');
      await loadCandidates();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo agregar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.delete<FormSubmission>(
        `/submissions/${submission.id}/collaborators/${userId}`
      );
      onUpdated(data);
      await loadCandidates();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo quitar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const collaborators = submission.collaborators ?? [];

  return (
    <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
      <h3 className="text-sm font-semibold text-sky-900 flex items-center gap-2">
        <UserPlus size={16} /> Colaboradores
      </h3>
      <p className="text-xs text-sky-800 mt-1">
        Inició: <strong>{submission.operator?.fullName ?? '—'}</strong>
        {submission.myRole === 'COLLABORATOR' && submission.addedBy && (
          <> · Te agregó: <strong>{submission.addedBy.fullName}</strong></>
        )}
      </p>

      {collaborators.length === 0 ? (
        <p className="text-xs text-sky-700 mt-2">Sin colaboradores aún.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {collaborators.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 text-sm text-sky-950 bg-white/70 rounded px-2 py-1.5"
            >
              <span>
                {c.user.fullName}
                <span className="text-xs text-sky-600 ml-2">
                  (agregó {c.addedBy.fullName})
                </span>
              </span>
              {isOwner && canManage && (
                <button
                  type="button"
                  onClick={() => removeCollaborator(c.userId)}
                  disabled={loading}
                  className="p-1 text-sky-500 hover:text-red-600 rounded"
                  title="Quitar colaborador"
                >
                  <X size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && canManage && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-sky-800 mb-1">Agregar operario</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sky-200 rounded-lg bg-white"
            >
              <option value="">Seleccione…</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={addCollaborator} loading={loading} disabled={!selectedId}>
            Agregar
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
