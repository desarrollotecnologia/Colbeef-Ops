import api from '@/lib/api';

export async function downloadSubmissionPdf(
  submissionId: string,
  suggestedName?: string
): Promise<void> {
  const response = await api.get(`/submissions/${submissionId}/pdf`, {
    responseType: 'blob',
  });

  const blobData = response.data as Blob;
  if (blobData.type?.includes('json')) {
    const text = await blobData.text();
    const parsed = JSON.parse(text) as { error?: string };
    throw new Error(parsed.error ?? 'No se pudo generar el PDF');
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
}
