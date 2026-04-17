import React, { useEffect, useRef, useState } from 'react';
import { ProcessingAnimation } from './ProcessingAnimation';
import type { BatchStatusResponse, JobStatusResponse } from '../api';

interface ProcessingOverlayProps {
  batchId: string;
  jobs: Array<{ job_id: string; filename: string }>;
  onComplete: (batchId: string) => void;
  onError: (message: string) => void;
  getBatchStatus: (batchId: string) => Promise<BatchStatusResponse>;
  getJobStatus: (jobId: string) => Promise<JobStatusResponse>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Queued',
  PROCESSING: 'Compressing…',
  COMPLETED:  'Done',
  FAILED:     'Failed',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-gray-500',
  PROCESSING: 'text-yellow-400 animate-pulse',
  COMPLETED:  'text-emerald-400',
  FAILED:     'text-red-400',
};

const LOG_MESSAGES = [
  'Analysing image metadata…',
  'Stripping EXIF data…',
  'Applying chroma subsampling…',
  'Running DCT compression…',
  'Optimising Huffman tables…',
  'Quantising colour palette…',
  'Writing compressed bytes…',
  'Finalising output stream…',
];

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  batchId,
  jobs,
  onComplete,
  onError,
  getBatchStatus,
  getJobStatus,
}) => {
  const [batch, setBatch] = useState<BatchStatusResponse | null>(null);
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatusResponse>>({});
  const [logLines, setLogLines] = useState<string[]>(['Initialising batch…']);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdxRef = useRef(0);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  // Rolling log lines for flavour
  useEffect(() => {
    logTimerRef.current = setInterval(() => {
      const msg = LOG_MESSAGES[logIdxRef.current % LOG_MESSAGES.length];
      setLogLines((prev) => [...prev.slice(-30), msg]);
      logIdxRef.current++;
    }, 1800);
    return () => { if (logTimerRef.current) clearInterval(logTimerRef.current); };
  }, []);

  // Poll batch + jobs every 2.5 s
  useEffect(() => {
    const poll = async () => {
      try {
        const batchData = await getBatchStatus(batchId);
        setBatch(batchData);

        // Update individual job statuses
        const updates: Record<string, JobStatusResponse> = {};
        await Promise.allSettled(
          jobs.map(async (j) => {
            try {
              updates[j.job_id] = await getJobStatus(j.job_id);
            } catch {/* keep previous */}
          })
        );
        setJobStatuses((prev) => ({ ...prev, ...updates }));

        if (batchData.status === 'COMPLETED' || batchData.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (logTimerRef.current) clearInterval(logTimerRef.current);
          setLogLines((prev) => [...prev, batchData.status === 'COMPLETED'
            ? '✓ All images processed successfully.'
            : '✗ Batch finished with errors.']);
          setTimeout(() => {
            if (batchData.status === 'COMPLETED') onComplete(batchId);
            else onError(`Batch failed: ${batchData.failed_jobs} job(s) failed.`);
          }, 800);
        }
      } catch (err) {
        setLogLines((prev) => [...prev, `Poll error: ${(err as Error).message}`]);
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [batchId, jobs, getBatchStatus, getJobStatus, onComplete, onError]);

  const progress = batch?.progress_percent ?? 0;
  const completed = batch?.completed_jobs ?? 0;
  const total = batch?.total_jobs ?? jobs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl mx-4 bg-[#111111]/95 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(218,165,32,0.1)] overflow-hidden border border-white/10">

        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-600" />

        <div className="p-8 flex flex-col gap-6">

          {/* Animation + title */}
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <ProcessingAnimation />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h2 className="font-schibsted font-bold text-2xl text-white">
                Compressing your images
              </h2>
              <p className="text-gray-400 text-sm">
                {completed} of {total} image{total !== 1 ? 's' : ''} processed
              </p>

              {/* Progress bar */}
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
                {/* shimmer */}
                <div
                  className="absolute inset-y-0 left-0 w-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)',
                    animation: 'shimmer 1.5s infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
              <p className="text-yellow-500 font-schibsted font-semibold text-sm">
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>

          {/* Per-job status list */}
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {jobs.map((j) => {
              const status = jobStatuses[j.job_id]?.status ?? 'PENDING';
              return (
                  <div
                  key={j.job_id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-sm text-gray-300 font-schibsted truncate max-w-[70%]">
                    {j.filename}
                  </span>
                  <span className={`text-xs font-schibsted font-semibold ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live log terminal */}
          <div
            ref={logRef}
            className="h-28 overflow-y-auto bg-black border border-white/5 shadow-inner rounded-xl px-4 py-3 font-mono text-xs text-yellow-600 flex flex-col gap-0.5"
          >
            {logLines.map((line, i) => (
              <span key={i} className="opacity-90">
                <span className="text-yellow-500 mr-2">&gt;</span><span className="text-gray-400">{line}</span>
              </span>
            ))}
            <span className="inline-block w-2 h-3 bg-yellow-500 animate-pulse" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
};
