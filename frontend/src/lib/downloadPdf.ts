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

export async function downloadSubmissionPdf(
  submissionId: string,
  suggestedName?: string
): Promise<void> {
  try {
    const response = await api.get(`/submissions/${submissionId}/pdf`, {
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
    let filename = suggestedName ?? `formato-${submissionId}.pdf`;
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) filename = match[1];

    const blob = new Blob([blobData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      throw new Error(await parseBlobError(err.response.data));
    }
    if (err instanceof Error) throw err;
    throw new Error('No se pudo descargar el PDF');
  }
}
