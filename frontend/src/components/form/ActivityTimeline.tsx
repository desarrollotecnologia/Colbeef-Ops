import type { SubmissionActivity } from '@/types';

const LABELS: Record<string, string> = {
  CREATED: 'Inició el formato',
  COLLABORATOR_ADDED: 'Agregó colaborador',
  COLLABORATOR_REMOVED: 'Quitó colaborador',
  SHEET_SAVED: 'Guardó hoja',
  SUBMITTED: 'Entregó a revisión',
  REJECTED: 'Rechazado — devolver para ajustar',
  APPROVED: 'Aprobado y firmado',
};

interface Props {
  activities?: SubmissionActivity[];
  compact?: boolean;
}

export default function ActivityTimeline({ activities = [], compact }: Props) {
  const visible = activities.filter((a) => a.type !== 'SHEET_SAVED' || !compact);
  if (visible.length === 0) return null;

  return (
    <div className={`rounded-lg border border-gray-200 bg-white px-4 py-3 ${compact ? 'mb-4' : 'mb-4'}`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Movimientos del formato</h3>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {visible.map((a) => {
          const when = new Date(a.createdAt).toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
          });
          return (
            <li
              key={a.id}
              className={`text-xs border-l-2 pl-3 py-0.5 ${
                a.type === 'REJECTED'
                  ? 'border-red-500 text-red-800'
                  : a.type === 'SUBMITTED'
                    ? 'border-amber-500 text-amber-900'
                    : a.type === 'APPROVED'
                      ? 'border-green-500 text-green-800'
                      : 'border-gray-300 text-gray-700'
              }`}
            >
              <span className="font-medium">{LABELS[a.type] ?? a.type}</span>
              {' · '}
              {a.actor?.fullName ?? '—'}
              {a.targetUser?.fullName ? ` → ${a.targetUser.fullName}` : ''}
              <span className="block text-gray-500">{when}</span>
              {a.type === 'REJECTED' && a.notes && (
                <span className="block mt-0.5 font-medium">Motivo: {a.notes}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
