import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ProcessingAnimation } from './ProcessingAnimation';
import type { BatchStatusResponse } from '../api';

interface ProcessingOverlayProps {
  batchId: string;
  jobs: Array<{ job_id: string; filename: string }>;
  onComplete: (batchId: string) => void;
  onError: (message: string) => void;
  getBatchStatus: (batchId: string) => Promise<BatchStatusResponse>;
}

type JobPhase = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

const STATUS_LABELS: Record<JobPhase, string> = {
  PENDING:    'Queued',
  PROCESSING: 'Compressing…',
  COMPLETED:  'Done',
  FAILED:     'Failed',
};

const STATUS_COLORS: Record<JobPhase, string> = {
  PENDING:    'text-gray-500',
  PROCESSING: 'text-yellow-400',
  COMPLETED:  'text-emerald-400',
  FAILED:     'text-red-400',
};

const DOT_COLORS: Record<JobPhase, string> = {
  PENDING:    'bg-gray-500',
  PROCESSING: 'bg-yellow-400',
  COMPLETED:  'bg-emerald-400',
  FAILED:     'bg-red-400',
};

const LOG_MESSAGES = [
  'Connecting to processing queue...',
  'Allocating serverless worker...',
  'Fetching source images from bucket...',
  'Analyzing image profiles and dimensions...',
  'Applying compression settings...',
  'Optimizing file size and encoding...',
  'Writing processed files to destination...',
  'Finalizing batch metadata...',
];

/**
 * Derive per-job visual status from the batch-level aggregates.
 * The worker processes jobs roughly in SQS arrival order, so we
 * show the first N as completed, the next one as processing, and
 * the rest as queued.  This avoids polling each job individually.
 */
function deriveJobPhases(
  jobCount: number,
  batch: BatchStatusResponse | null,
): JobPhase[] {
  if (!batch) return Array(jobCount).fill('PENDING');

  const { completed_jobs: completed, failed_jobs: failed, status } = batch;
  const finished = completed + failed;

  return Array.from({ length: jobCount }, (_, i) => {
    // Batch reached a terminal state — assign completed then failed
    if (status === 'COMPLETED' || status === 'FAILED') {
      return i < completed ? 'COMPLETED' : 'FAILED';
    }
    if (i < completed) return 'COMPLETED';
    if (i < finished) return 'FAILED';
    if (i === finished && (status === 'PROCESSING' || finished > 0)) {
      return 'PROCESSING';
    }
    return 'PENDING';
  });
}

const POLL_INTERVAL_MS = 3000;

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  batchId,
  jobs,
  onComplete,
  onError,
  getBatchStatus,
}) => {
  const [batch, setBatch] = useState<BatchStatusResponse | null>(null);
  const [logLines, setLogLines] = useState<string[]>(['Initialising batch…']);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdxRef = useRef(0);

  const jobPhases = useMemo(
    () => deriveJobPhases(jobs.length, batch),
    [jobs.length, batch],
  );

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

  // Poll batch status only — single request per cycle
  useEffect(() => {
    const poll = async () => {
      try {
        const batchData = await getBatchStatus(batchId);
        setBatch(batchData);

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
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [batchId, getBatchStatus, onComplete, onError]);

  const progress = batch?.progress_percent ?? 0;
  const completed = batch?.completed_jobs ?? 0;
  const total = batch?.total_jobs ?? jobs.length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
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
            {jobs.map((j, i) => {
              const phase = jobPhases[i];
              return (
                <div
                  key={j.job_id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5 transition-all duration-500"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500 ${DOT_COLORS[phase]} ${phase === 'PROCESSING' ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-sm text-gray-300 font-schibsted truncate max-w-[70%]">
                      {j.filename}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-schibsted font-semibold transition-colors duration-500 ${STATUS_COLORS[phase]} ${phase === 'PROCESSING' ? 'animate-pulse' : ''}`}
                  >
                    {STATUS_LABELS[phase]}
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
    </div>,
    document.body
  );
};
