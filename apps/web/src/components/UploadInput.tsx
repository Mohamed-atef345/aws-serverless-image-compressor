import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon, CompressIcon, AISparkleIcon } from './Icons';
import { CustomDropdown } from './CustomDropdown';

// API module for backend integration
// Import types and functions when ready:
// import { API_ENDPOINTS, apiRequest, uploadToS3, ... } from '../api';
// See src/api/index.ts for full API documentation and types

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 20;

interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
}

interface UploadState {
  isDragging: boolean;
  files: FileWithPreview[];
  compressionLevel: string;
  outputFormat: string;
}

const compressionOptions = [
  { value: 'low', label: 'Low (Better Quality)' },
  { value: 'medium', label: 'Medium (Balanced)' },
  { value: 'high', label: 'High (Smaller Size)' },
];

const formatOptions = [
  { value: 'original', label: 'Keep Original' },
  { value: 'webp', label: 'Convert to WebP' },
  { value: 'jpeg', label: 'Convert to JPEG' },
  { value: 'png', label: 'Convert to PNG' },
];

// Close icon component
const CloseIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Plus icon component
const PlusIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UploadInput: React.FC = () => {
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    files: [],
    compressionLevel: 'medium',
    outputFormat: 'original',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      state.files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter((file) => file.type.startsWith('image/'));
    
    setState((prev) => {
      const remainingSlots = MAX_FILES - prev.files.length;
      const filesToAdd = imageFiles.slice(0, remainingSlots);
      
      const newFileObjects: FileWithPreview[] = filesToAdd.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preview: URL.createObjectURL(file),
      }));

      return {
        ...prev,
        files: [...prev.files, ...newFileObjects],
      };
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setState((prev) => {
      const fileToRemove = prev.files.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return {
        ...prev,
        files: prev.files.filter((f) => f.id !== id),
      };
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, isDragging: false }));
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [addFiles]);

  const handleDropZoneClick = () => {
    if (state.files.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleAddMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addMoreInputRef.current?.click();
  };

  const handleCompress = useCallback(async () => {
    if (state.files.length === 0) return;

    // TODO: Implement when API Gateway endpoints are ready
    console.log('Starting compression with settings:', {
      files: state.files.map(f => f.file),
      compressionLevel: state.compressionLevel,
      outputFormat: state.outputFormat,
    });
  }, [state]);

  const totalSize = state.files.reduce((acc, f) => acc + f.file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const canAddMore = state.files.length < MAX_FILES;

  return (
    <div className="w-full max-w-[728px]">
      {/* Main Upload Card */}
      <div
        className="relative rounded-[20px] backdrop-blur-md shadow-2xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
      >
        {/* Top Row - Credits & AI Badge */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-schibsted font-medium text-sm text-white/90">
              {state.files.length > 0 
                ? `${state.files.length}/${MAX_FILES} images selected` 
                : '50/100 free compressions'}
            </span>
            <button className="px-3 py-1 rounded-lg text-xs font-schibsted font-semibold text-black bg-upgrade-green hover:opacity-90 transition-opacity">
              Upgrade
            </button>
          </div>
          <div className="flex items-center gap-2">
            <AISparkleIcon className="w-4 h-4 text-white/80" />
            <span className="font-schibsted font-medium text-sm text-white/80">
              Smart Compression AI
            </span>
          </div>
        </div>

        {/* Main Drop Zone */}
        <div
          className={`mx-3 mb-3 bg-white rounded-2xl shadow-lg transition-all ${
            state.files.length === 0 ? 'cursor-pointer hover:bg-gray-50' : ''
          } ${state.isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
          onClick={handleDropZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={addMoreInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {state.files.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <UploadIcon className="w-10 h-10 text-indigo-500" />
              </div>
              <p className="font-schibsted font-semibold text-lg text-black mb-2">
                Drop your images here
              </p>
              <p className="font-schibsted text-sm text-gray-text mb-5">
                or <span className="text-indigo-600 font-medium">click to browse</span>
              </p>
              <p className="font-schibsted text-xs text-gray-400">
                Supports PNG, JPEG, WebP, GIF up to {MAX_FILE_SIZE_MB}MB (max {MAX_FILES} images)
              </p>
            </div>
          ) : (
            /* Files Selected State */
            <div className="p-4">
              {/* Image Grid */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                {state.files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={fileObj.preview}
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileObj.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CloseIcon className="w-3.5 h-3.5 text-white" />
                    </button>
                    {/* File size badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-medium text-white">
                      {formatSize(fileObj.file.size)}
                    </div>
                  </div>
                ))}

                {/* Add More Button */}
                {canAddMore && (
                  <button
                    onClick={handleAddMoreClick}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 flex flex-col items-center justify-center transition-colors"
                  >
                    <PlusIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Add more</span>
                  </button>
                )}
              </div>

              {/* Summary and Start Button */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="font-schibsted font-medium text-sm text-black">
                    {state.files.length} image{state.files.length > 1 ? 's' : ''} ready
                  </p>
                  <p className="font-schibsted text-xs text-gray-text">
                    Total size: {formatSize(totalSize)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompress();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <CompressIcon className="w-5 h-5 text-white" />
                  <span className="font-schibsted font-semibold text-sm text-white">
                    Start Compression
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row - Options with Custom Dropdowns */}
        <div className="flex items-center justify-between px-4 pb-4 relative z-50">
          <div className="flex items-center gap-3">
            {/* Compression Level Dropdown */}
            <CustomDropdown
              id="compression-level"
              options={compressionOptions}
              value={state.compressionLevel}
              onChange={(value) =>
                setState((prev) => ({ ...prev, compressionLevel: value }))
              }
            />

            {/* Output Format Dropdown */}
            <CustomDropdown
              id="output-format"
              options={formatOptions}
              value={state.outputFormat}
              onChange={(value) =>
                setState((prev) => ({ ...prev, outputFormat: value }))
              }
            />
          </div>

          {/* Max file size hint */}
          <span className="font-schibsted font-medium text-sm text-white/50">
            Max {MAX_FILE_SIZE_MB}MB per file
          </span>
        </div>
      </div>
    </div>
  );
};
