import ColbeefWordmark from './ColbeefWordmark';
import { formatSpanishDateLong } from '@/lib/formatDate';

interface Props {
  formatName: string;
  sheetName: string;
  sheetIndex: number;
  sheetTotal: number;
  documentCode?: string;
  workDate: string;
  operatorName: string;
  empresa?: string;
}

export default function FormatSheetHeader({
  formatName,
  sheetName,
  sheetIndex,
  sheetTotal,
  documentCode,
  workDate,
  operatorName,
  empresa = 'COLBEEF S.A.S',
}: Props) {
  const fecha = formatSpanishDateLong(workDate);

  return (
    <div className="border-2 border-gray-800 rounded-sm overflow-hidden mb-6 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b-2 border-gray-800">
        <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-800 flex items-center justify-center sm:justify-start bg-white">
          <ColbeefWordmark size="md" />
        </div>
        <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-800 text-center flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-wide text-gray-600 font-semibold">
            Sistema de Aseguramiento de la Inocuidad
          </p>
          <h2 className="text-sm font-bold text-gray-900 leading-snug mt-1 uppercase">{formatName}</h2>
          <p className="text-xs font-bold text-primary-800 mt-1">{empresa}</p>
        </div>
        <div className="p-3 text-xs text-gray-800 space-y-0.5 flex flex-col justify-center">
          <p><span className="font-bold">Hoja:</span> {sheetIndex + 1} / {sheetTotal}</p>
          {documentCode && <p><span className="font-bold">Código:</span> {documentCode}</p>}
          <p><span className="font-bold">Versión:</span> 2.0.0</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#e8edf2] border-b border-gray-800 text-sm">
        <div className="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-gray-800">
          <span className="font-bold text-gray-900 uppercase">Fecha: </span>
          <span className="capitalize">{fecha}</span>
        </div>
        <div className="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-gray-800">
          <span className="font-bold text-gray-900 uppercase">Operario: </span>
          {operatorName}
        </div>
        <div className="px-4 py-2.5">
          <span className="font-bold text-gray-900 uppercase">Hoja: </span>
          {sheetName}
        </div>
      </div>
    </div>
  );
}
