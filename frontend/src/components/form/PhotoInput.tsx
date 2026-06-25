import { Camera, X } from 'lucide-react';

function normalizePhotos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
  }
  if (typeof value === 'string' && value) return [value];
  return [];
}

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxPhotos?: number;
}

export default function PhotoInput({ label, value, onChange, disabled, multiple, maxPhotos = 20 }: Props) {
  if (!multiple) {
    const src = typeof value === 'string' ? value : '';
    return (
      <div>
        {src && (
          <img src={src} alt={label} className="mb-2 max-h-40 rounded-lg border border-gray-200" />
        )}
        {!disabled && (
          <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
            <Camera size={20} className="text-gray-400" />
            <span className="text-sm text-gray-600">{src ? 'Cambiar foto' : 'Tomar / subir foto'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange(reader.result as string);
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    );
  }

  const photos = normalizePhotos(value);
  const atLimit = photos.length >= maxPhotos;

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = maxPhotos - photos.length;
    const toRead = Array.from(files).slice(0, remaining);
    if (toRead.length === 0) return;

    Promise.all(
      toRead.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      )
    ).then((newPhotos) => onChange([...photos, ...newPhotos]));
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((src, index) => (
            <div key={`${index}-${src.slice(0, 32)}`} className="relative group">
              <img
                src={src}
                alt={`${label} ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 shadow"
                  aria-label={`Eliminar foto ${index + 1}`}
                >
                  <X size={14} />
                </button>
              )}
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-black/50 text-white rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {!disabled && !atLimit && (
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
          <Camera size={20} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            {photos.length === 0 ? 'Tomar / subir fotos' : 'Agregar más fotos'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-gray-500">
          {photos.length} foto{photos.length !== 1 ? 's' : ''}
          {!atLimit && ` · hasta ${maxPhotos}`}
        </p>
      )}
    </div>
  );
}

export function normalizePhotoValue(value: unknown, multiple?: boolean): string[] {
  if (!multiple) {
    return typeof value === 'string' && value ? [value] : [];
  }
  return normalizePhotos(value);
}
