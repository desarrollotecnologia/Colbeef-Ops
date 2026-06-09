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
  const fecha = new Date(workDate + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="border-2 border-gray-800 rounded-lg overflow-hidden mb-6 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b-2 border-gray-800">
        <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-300 flex items-center gap-2">
          <img src="/colbeef-logo.png" alt="Colbeef" className="h-12 w-auto object-contain" />
        </div>
        <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-300 text-center">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Sistema de Aseguramiento de la Inocuidad</p>
          <h2 className="text-sm font-bold text-gray-900 leading-tight mt-1">{formatName}</h2>
          <p className="text-xs font-semibold text-primary-800 mt-1">{empresa}</p>
        </div>
        <div className="p-3 text-xs text-gray-600 space-y-1">
          <p><span className="font-semibold">Hoja:</span> {sheetIndex + 1} / {sheetTotal}</p>
          {documentCode && <p><span className="font-semibold">Código:</span> {documentCode}</p>}
          <p><span className="font-semibold">Versión:</span> 2.0.0</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-gray-100 border-b border-gray-300 text-sm">
        <div className="px-4 py-2 border-b sm:border-b-0 sm:border-r border-gray-300">
          <span className="font-semibold text-gray-700">FECHA: </span>
          <span className="capitalize">{fecha}</span>
        </div>
        <div className="px-4 py-2 border-b sm:border-b-0 sm:border-r border-gray-300">
          <span className="font-semibold text-gray-700">OPERARIO: </span>
          {operatorName}
        </div>
        <div className="px-4 py-2">
          <span className="font-semibold text-gray-700">HOJA: </span>
          {sheetName}
        </div>
      </div>
    </div>
  );
}
