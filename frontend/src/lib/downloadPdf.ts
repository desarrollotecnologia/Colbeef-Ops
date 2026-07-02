import axios from 'axios';
import api from '@/lib/api';

async function parseBlobError(data: Blob): Promise<string> {
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error ?? 'No se pudo generar el PDF';
  } catch {
    return 'No se pudo generar el PDF';
  }
}

export type PdfDownloadOptions = {
  /** Solo esta hoja del formato */
  sheetId?: string;
  /** Todas las hojas con separadores visuales */
  scope?: 'all';
  suggestedName?: string;
};

export async function downloadSubmissionPdf(
  submissionId: string,
  options?: PdfDownloadOptions | string
): Promise<void> {
  const opts: PdfDownloadOptions =
    typeof options === 'string' ? { suggestedName: options } : (options ?? {});

  const params = new URLSearchParams();
  if (opts.sheetId) {
    params.set('sheetId', opts.sheetId);
  } else if (opts.scope === 'all') {
    params.set('scope', 'all');
  }

  const query = params.toString();
  const url = `/submissions/${submissionId}/pdf${query ? `?${query}` : ''}`;

  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blobData = response.data as Blob;

    if (blobData.type?.includes('json') || blobData.size < 100) {
      throw new Error(await parseBlobError(blobData));
    }

    const header = await blobData.slice(0, 5).text();
    if (!header.startsWith('%PDF-')) {
      throw new Error('La respuesta del servidor no es un PDF válido');
    }

    const disposition = response.headers['content-disposition'] as string | undefined;
    let filename = opts.suggestedName ?? `formato-${submissionId}.pdf`;
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) filename = match[1];

    const blob = new Blob([blobData], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      throw new Error(await parseBlobError(err.response.data));
    }
    if (err instanceof Error) throw err;
    throw new Error('No se pudo descargar el PDF');
  }
}
