import { FileText, Image as ImageIcon } from 'lucide-react';

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon size={16} />;
  return <FileText size={16} />;
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const base64ToBlobUrl = (data: string, mimeType: string): string => {
  const byteChars = atob(data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  return URL.createObjectURL(blob);
};

export const getFileDataUrl = (mimeType: string, data?: string | null) => {
  if (!data) return null;
  return `data:${mimeType};base64,${data}`;
};

export const openFile = (mimeType: string, data?: string | null) => {
  if (!data) return;
  const url = base64ToBlobUrl(data, mimeType);
  window.open(url);
};

export const downloadFile = (mimeType: string, data?: string | null, fileName?: string) => {
  if (!data) return;
  const url = getFileDataUrl(mimeType, data);
  if (!url) return;
  const ext = mimeType === 'application/pdf' ? '.pdf' : '.jpg';
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `file${ext}`;
  link.rel = 'noopener noreferrer';
  link.click();
};
