import { useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import './AttachmentUploader.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export interface AttachmentFile {
  id: string;
  fileName: string;
  mimeType: string;
  data: string;
  size: number;
  isExisting?: boolean;
}

interface AttachmentUploaderProps {
  files: AttachmentFile[];
  onChange: (files: AttachmentFile[]) => void;
  disabled?: boolean;
  error?: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon size={16} />;
  return <FileText size={16} />;
};

const AttachmentUploader = ({ files, onChange, disabled, error }: AttachmentUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';

    if (selected.length === 0) return;

    const remainingSlots = MAX_FILES - files.length;
    if (remainingSlots <= 0) return;

    const toProcess = selected.slice(0, remainingSlots);
    const nextFiles = [...files];

    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const data = await fileToBase64(file);
      nextFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        fileName: file.name,
        mimeType: file.type,
        data,
        size: file.size
      });
    }

    onChange(nextFiles);
  };

  const removeFile = (id: string) => {
    onChange(files.filter((file) => file.id !== id));
  };

  return (
    <div className="attachment-uploader">
      <label className="form-label">Attachments</label>
      <p className="attachment-hint">JPG, PNG, or PDF — max 5 MB each, up to {MAX_FILES} files</p>

      <div
        className={`attachment-dropzone ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <Upload size={20} />
        <span>Click to upload files</span>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          multiple
          hidden
          disabled={disabled || files.length >= MAX_FILES}
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <ul className="attachment-list">
          {files.map((file) => (
            <li key={file.id} className="attachment-item">
              <span className="attachment-item-icon">{getFileIcon(file.mimeType)}</span>
              <span className="attachment-item-name" title={file.fileName}>
                {file.fileName}
              </span>
              {!disabled && (
                <button
                  type="button"
                  className="attachment-remove-btn"
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.fileName}`}
                >
                  <X size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default AttachmentUploader;
