import React, {useState, useCallback, useRef} from "react";
import {CustomDropdown, DropdownContext} from "./CustomDropdown";
import {ProcessingOverlay} from "./ProcessingOverlay";
import {
  createBatchUpload,
  uploadToPresignedUrl,
  getBatchStatus,
  getJobStatus,
  getBatchDownload,
  type UploadSettings,
  type CreateBatchResponse,
} from "../api";

// ──────────────────────────── helpers ────────────────────────────────────────

const FORMAT_OPTIONS = [
  {value: "WEBP", label: "WebP (recommended)"},
  {value: "JPEG", label: "JPEG"},
  {value: "PNG", label: "PNG"},
];

const QUALITY_OPTIONS = [
  {value: "95", label: "Quality 95 – Lossless-like"},
  {value: "80", label: "Quality 80 – High quality"},
  {value: "65", label: "Quality 65 – Balanced"},
  {value: "50", label: "Quality 50 – Small size"},
];

const MAX_WIDTH_OPTIONS = [
  {value: "0", label: "No resize"},
  {value: "1920", label: "Max 1920 px"},
  {value: "1280", label: "Max 1280 px"},
  {value: "800", label: "Max 800 px"},
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILES = 20;
const MAX_FILE_MB = 20;

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ──────────────────────────── component ──────────────────────────────────────

type AppPhase = "idle" | "uploading" | "processing" | "done" | "error";

export const UploadInput: React.FC = () => {
  // Dropdown context for the settings panel
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Settings
  const [format, setFormat] = useState<string>("WEBP");
  const [quality, setQuality] = useState<string>("80");
  const [maxWidth, setMaxWidth] = useState<string>("1920");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [batchResponse, setBatchResponse] =
    useState<CreateBatchResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");

  // ── File validation ───────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_MB * 1024 * 1024) return false;
      return true;
    });
    setFiles((prev) => {
      const merged = [...prev, ...valid];
      return merged.slice(0, MAX_FILES);
    });
  }, []);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // ── Upload flow ───────────────────────────────────────────────────────────

  const handleCompress = async () => {
    if (files.length === 0) return;

    try {
      setPhase("uploading");
      setUploadProgress(0);

      const settings: UploadSettings = {
        quality: parseInt(quality, 10),
        format: format as "WEBP" | "JPEG" | "PNG",
        max_width: parseInt(maxWidth, 10),
      };

      // 1. Create batch → get presigned URLs
      const batchData = await createBatchUpload({
        files: files.map((f) => ({
          filename: f.name,
          content_type: f.type || "image/jpeg",
        })),
        settings,
      });
      setBatchResponse(batchData);

      // 2. Upload each file to S3 via presigned URL
      const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
      const uploadedBytesMap = new Map<string, number>();

      await Promise.all(
        batchData.jobs.map(async (job) => {
          const file = files.find((f) => f.name === job.filename)!;
          await uploadToPresignedUrl(
            job.upload_url,
            file,
            (progressPercent) => {
              const bytesForThisFile = (progressPercent / 100) * file.size;
              uploadedBytesMap.set(job.filename, bytesForThisFile);

              let totalUploaded = 0;
              uploadedBytesMap.forEach((bytes) => {
                totalUploaded += bytes;
              });

              // Ensure we don't accidentally exceed 100 on rounding weirdness
              setUploadProgress(
                Math.min(100, Math.round((totalUploaded / totalBytes) * 100)),
              );
            },
          );
        }),
      );

      // 3. Hand off to processing overlay
      setPhase("processing");
    } catch (err) {
      setErrorMessage((err as Error).message);
      setPhase("error");
    }
  };

  const handleProcessingComplete = async (batchId: string) => {
    try {
      const dl = await getBatchDownload(batchId);
      setDownloadUrl(dl.download_url);
      setPhase("done");
    } catch (err) {
      setErrorMessage((err as Error).message);
      setPhase("error");
    }
  };

  const handleProcessingError = (msg: string) => {
    setErrorMessage(msg);
    setPhase("error");
  };

  const reset = () => {
    setFiles([]);
    setPhase("idle");
    setErrorMessage("");
    setBatchResponse(null);
    setDownloadUrl("");
    setUploadProgress(0);
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="w-full max-w-[760px] rounded-3xl bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl border border-white/10 p-10 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <svg
            className="w-10 h-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-schibsted font-bold text-2xl text-white mb-2">
            All done!
          </h3>
          <p className="text-gray-400 text-sm">
            Your compressed images are ready to download.
          </p>
        </div>
        <a
          href={downloadUrl}
          id="download-button"
          download
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-schibsted font-semibold text-base shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all"
        >
          Download Images
        </a>
        <button
          onClick={reset}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Compress more images
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="w-full max-w-[760px] rounded-3xl bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl border border-white/10 p-10 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-schibsted font-bold text-2xl text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-red-400 text-sm max-w-sm">{errorMessage}</p>
        </div>
        <button
          onClick={reset}
          className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-schibsted font-semibold text-base hover:bg-white/20 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <DropdownContext.Provider value={{openDropdownId, setOpenDropdownId}}>
      {/* Processing overlay rendered outside the card */}
      {phase === "processing" && batchResponse && (
        <ProcessingOverlay
          batchId={batchResponse.batch_id}
          jobs={batchResponse.jobs}
          onComplete={handleProcessingComplete}
          onError={handleProcessingError}
          getBatchStatus={getBatchStatus}
          getJobStatus={getJobStatus}
        />
      )}

      <div className="w-full max-w-[760px] rounded-3xl bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl border border-white/10 overflow-visible">
        {/* ── Drop zone ──────────────────────────────────────────────── */}
        <div
          id="drop-zone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => files.length === 0 && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 px-8 py-10 cursor-pointer transition-all duration-200 rounded-t-3xl ${
            isDragOver
              ? "bg-yellow-500/10 border-2 border-dashed border-yellow-500/50"
              : files.length > 0
                ? "bg-black/40 border-b border-white/10"
                : "hover:bg-black/60 border-2 border-dashed border-white/10 hover:border-yellow-500/30 bg-black/40"
          }`}
        >
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          />

          {files.length === 0 ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-schibsted font-semibold text-gray-200">
                  Drop images here, or{" "}
                  <span className="text-yellow-500 hover:text-yellow-400 transition-colors underline underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  JPEG, PNG, WebP, GIF · max {MAX_FILE_MB} MB · up to{" "}
                  {MAX_FILES} files
                </p>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-schibsted font-semibold text-gray-300 text-sm">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  type="button"
                  className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors font-schibsted"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  + Add more
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-black/60 rounded-lg border border-white/5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-yellow-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-300 font-schibsted truncate">
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-500">
                        {prettySize(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Settings row ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap px-6 py-4 bg-gradient-to-r from-yellow-600/10 to-yellow-800/10 border-y border-white/5">
          <span className="font-schibsted font-medium text-yellow-500 text-sm mr-1">
            Settings:
          </span>

          <CustomDropdown
            id="format-dropdown"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />
          <CustomDropdown
            id="quality-dropdown"
            options={QUALITY_OPTIONS}
            value={quality}
            onChange={setQuality}
          />
          <CustomDropdown
            id="maxwidth-dropdown"
            options={MAX_WIDTH_OPTIONS}
            value={maxWidth}
            onChange={setMaxWidth}
          />
        </div>

        {/* ── Action bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 rounded-b-3xl">
          <div className="text-xs text-gray-500 font-schibsted">
            {files.length === 0
              ? "No files selected"
              : `${files.length} image${files.length !== 1 ? "s" : ""} · ${prettySize(files.reduce((a, f) => a + f.size, 0))}`}
          </div>

          {phase === "uploading" ? (
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-300"
                  style={{width: `${uploadProgress}%`}}
                />
              </div>
              <span className="text-sm text-yellow-500 font-schibsted font-semibold">
                {uploadProgress}%
              </span>
            </div>
          ) : (
            <button
              id="compress-button"
              type="button"
              disabled={files.length === 0}
              onClick={handleCompress}
              className={`px-6 py-2.5 rounded-xl font-schibsted font-semibold text-sm transition-all duration-200 ${
                files.length === 0
                  ? "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] hover:brightness-110"
              }`}
            >
              Compress{" "}
              {files.length > 0
                ? `${files.length} image${files.length !== 1 ? "s" : ""}`
                : "images"}
            </button>
          )}
        </div>
      </div>
    </DropdownContext.Provider>
  );
};
