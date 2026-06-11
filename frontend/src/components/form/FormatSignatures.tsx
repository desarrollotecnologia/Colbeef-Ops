import type { SubmissionStatus } from '@/types';

interface Props {
  elaboroName: string;
  verificoName?: string | null;
  status: SubmissionStatus;
  /** En revisión admin: muestra el nombre del jefe que firmará al aprobar */
  pendingVerifierName?: string;
}

export default function FormatSignatures({
  elaboroName,
  verificoName,
  status,
  pendingVerifierName,
}: Props) {
  const verificoDisplay =
    verificoName ??
    (status === 'PENDING_REVIEW' && pendingVerifierName ? pendingVerifierName : '—');

  const showPendingVerifier =
    status === 'PENDING_REVIEW' && pendingVerifierName && !verificoName;

  return (
    <div className="border-2 border-gray-800 rounded-sm overflow-hidden mt-6 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
        <div className="px-4 py-4">
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Elaboró</p>
          <p className="text-sm font-semibold text-gray-900 border-b border-gray-400 pb-2 min-h-[2rem]">
            {elaboroName || '—'}
          </p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Verificó</p>
          <p className={`text-sm font-semibold border-b border-gray-400 pb-2 min-h-[2rem] ${
            showPendingVerifier ? 'text-primary-800' : 'text-gray-900'
          }`}>
            {verificoDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}
