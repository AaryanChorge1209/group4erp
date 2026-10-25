import React from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 25 * 1024 * 1024,
  label = 'Upload a file',
  selectedFile,
  onClear,
  className = ''
}) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div className={cn('w-full', className)}>
      {selectedFile ? (
        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-navy-800">
          <div className="flex items-center gap-2.5 truncate">
            <File className="w-5 h-5 text-primary-500 shrink-0" />
            <div className="truncate text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-gray-400 hover:text-red-500 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center',
            isDragActive
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
              : isDragReject
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 bg-white dark:bg-navy-800/60'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragActive ? 'Drop file here' : label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drag & drop or click to browse (Max {(maxSize / (1024 * 1024)).toFixed(0)}MB)
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
