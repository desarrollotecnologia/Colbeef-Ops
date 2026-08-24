import FormatSheetHeader from './FormatSheetHeader';
import FormatSignatures from './FormatSignatures';
import SheetFields from './SheetFields';
import Card, { CardBody } from '@/components/Card';
import type { FormSubmission, FormatSheet, SubmissionStatus } from '@/types';

interface Props {
  submission: FormSubmission;
  sheets: FormatSheet[];
  currentSheetIndex: number;
  onSheetIndexChange: (index: number) => void;
  sheetDataById: Record<string, Record<string, unknown>>;
  workDate: string;
  operatorName: string;
  readOnly?: boolean;
  onFieldUpdate?: (fieldKey: string, value: unknown) => void;
  onBeforeSheetChange?: () => void | Promise<void>;
  /** Muestra Elaboró / Verificó al pie de cada hoja */
  showSignaturesPerSheet?: boolean;
  verificoName?: string | null;
  pendingVerifierName?: string;
  status: SubmissionStatus;
  sheetTabExtra?: (sheet: FormatSheet, index: number) => React.ReactNode;
  currentUserId?: string;
  currentUserName?: string;
}

export default function FormatSubmissionViewer({
  submission,
  sheets,
  currentSheetIndex,
  onSheetIndexChange,
  sheetDataById,
  workDate,
  operatorName,
  readOnly = false,
  onFieldUpdate,
  onBeforeSheetChange,
  showSignaturesPerSheet = false,
  verificoName,
  pendingVerifierName,
  status,
  sheetTabExtra,
  currentUserId,
  currentUserName,
}: Props) {
  const currentSheet = sheets[currentSheetIndex];
  const fields = currentSheet?.fields ?? [];
  const sheetData = sheetDataById[currentSheet?.id ?? ''] ?? {};
  const formatCode = submission.format?.code;
  const isPediluvios = formatCode === 'REGISTRO_PEDILUVIOS';
  const isLactico =
    formatCode === 'TITULACION_ACIDO_LACTICO' ||
    formatCode === 'MONITOREO_TITULACION_ACIDO_LACTICO';
  const hideElaboro = isPediluvios || isLactico;
  const isOwner =
    submission.myRole === 'OWNER' ||
    submission.operatorId === currentUserId;

  const changeSheet = async (index: number) => {
    if (onBeforeSheetChange) await onBeforeSheetChange();
    onSheetIndexChange(index);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {sheets.map((sheet, idx) => (
          <button
            key={sheet.id}
            type="button"
            onClick={() => changeSheet(idx)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              idx === currentSheetIndex
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>
              {idx + 1}. {sheet.name}
            </span>
            {sheetTabExtra?.(sheet, idx)}
          </button>
        ))}
      </div>

      <FormatSheetHeader
        formatName={submission.format?.name ?? ''}
        sheetName={currentSheet?.name ?? ''}
        sheetIndex={currentSheetIndex}
        sheetTotal={sheets.length}
        documentCode={submission.format?.documentCode}
        workDate={workDate}
        operatorName={operatorName}
        dateMode={isPediluvios ? 'inicio_cierre' : 'default'}
        fechaInicio={workDate}
        fechaCierre={submission.submittedAt ?? null}
        hideOperator={isPediluvios}
      />

      <Card>
        <CardBody className="pt-6">
          {fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Esta hoja aún no tiene campos configurados.</p>
          ) : (
            <SheetFields
              fields={fields}
              sheetData={sheetData}
              onUpdate={onFieldUpdate ?? (() => {})}
              workDate={workDate}
              disabled={readOnly}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isSubmissionOwner={isOwner}
              ownerName={submission.operator?.fullName}
            />
          )}
          {showSignaturesPerSheet && (
            <FormatSignatures
              elaboroName={operatorName}
              verificoName={verificoName}
              status={status}
              pendingVerifierName={pendingVerifierName}
              hideElaboro={hideElaboro}
            />
          )}
        </CardBody>
      </Card>
    </>
  );
}
