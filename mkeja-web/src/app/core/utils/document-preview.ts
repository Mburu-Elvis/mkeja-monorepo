export type DocumentPreviewKind = 'image' | 'pdf' | 'file';

export function resolveDocumentPreviewKind(
  blob: Blob,
  mimeType?: string | null,
  fileName?: string | null
): DocumentPreviewKind {
  const type = (mimeType || blob.type || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  if (type === 'application/pdf' || type.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(name)) {
    return 'image';
  }
  return 'file';
}

export async function resolveDocumentPreviewKindAsync(
  blob: Blob,
  mimeType?: string | null,
  fileName?: string | null
): Promise<DocumentPreviewKind> {
  const resolved = resolveDocumentPreviewKind(blob, mimeType, fileName);
  if (resolved !== 'file' || blob.size === 0) {
    return resolved;
  }

  try {
    const header = await blob.slice(0, 5).text();
    if (header.startsWith('%PDF')) {
      return 'pdf';
    }
    const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      return 'image';
    }
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image';
    }
  } catch {
    // fall through
  }

  return 'file';
}
