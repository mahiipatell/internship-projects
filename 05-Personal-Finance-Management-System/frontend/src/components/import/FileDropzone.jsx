import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

function FileDropzone({ onFileSelected, error, accept = '.csv' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const label = accept === '.xlsx' ? 'Excel' : 'CSV';

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-12 text-center
          ${
            dragging
              ? 'border-primary-500 bg-primary-50 scale-[1.01]'
              : 'border-olive-900/15 bg-cream hover:border-primary-400 hover:bg-primary-50/50'
          }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
          {dragging ? (
            <FileSpreadsheet className="text-primary-600" size={28} />
          ) : (
            <UploadCloud className="text-primary-600" size={28} />
          )}
        </div>
        <p className="font-semibold text-olive-900">Drag & drop your {label} file here</p>
        <p className="text-sm text-olive-600/60 mt-1">or click to browse from your computer</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <div className="mt-3 text-sm text-expense bg-expense/10 rounded-xl px-4 py-2.5">{error}</div>
      )}
    </div>
  );
}

export default FileDropzone;
