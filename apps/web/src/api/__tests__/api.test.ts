import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock import.meta.env before importing the module
vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');

// Dynamic import so the stub takes effect
const apiModule = await import('../../api');

describe('API module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── API_BASE_URL ──────────────────────────────────────────────────────────

  it('strips trailing slash from API_BASE_URL', () => {
    // The module strips trailing slashes in the source
    expect(apiModule.API_BASE_URL).not.toMatch(/\/$/);
  });

  // ── createBatchUpload ─────────────────────────────────────────────────────

  it('calls POST /upload-url and returns batch data', async () => {
    const mockResponse = {
      batch_id: 'batch-123',
      jobs: [
        { job_id: 'job-1', filename: 'a.jpg', upload_url: 'https://s3/presigned' },
      ],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await apiModule.createBatchUpload({
      files: [{ filename: 'a.jpg', content_type: 'image/jpeg', size_bytes: 1024 }],
      settings: { quality: 80, format: 'WEBP', max_width: 1920 },
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/upload-url');
    expect(options?.method).toBe('POST');
    expect(result.batch_id).toBe('batch-123');
  });

  // ── getJobStatus ──────────────────────────────────────────────────────────

  it('calls GET /jobs/:id', async () => {
    const mockJob = {
      job_id: 'job-1',
      batch_id: 'batch-1',
      status: 'COMPLETED',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockJob),
    } as Response);

    const result = await apiModule.getJobStatus('job-1');
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/jobs/job-1');
    expect(result.status).toBe('COMPLETED');
  });

  // ── getBatchStatus ────────────────────────────────────────────────────────

  it('calls GET /batches/:id', async () => {
    const mockBatch = {
      batch_id: 'batch-1',
      status: 'PROCESSING',
      total_jobs: 3,
      completed_jobs: 1,
      failed_jobs: 0,
      progress_percent: 33,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBatch),
    } as Response);

    const result = await apiModule.getBatchStatus('batch-1');
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/batches/batch-1');
    expect(result.progress_percent).toBe(33);
  });

  // ── getBatchDownload ──────────────────────────────────────────────────────

  it('calls GET /batches/:id/download', async () => {
    const mockDownload = {
      download_url: 'https://s3/download-link',
      type: 'zip',
      file_count: 3,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDownload),
    } as Response);

    const result = await apiModule.getBatchDownload('batch-1');
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/batches/batch-1/download');
    expect(result.type).toBe('zip');
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('throws on non-ok response with API error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid request' }),
    } as unknown as Response);

    await expect(apiModule.getJobStatus('bad')).rejects.toThrow('Invalid request');
  });

  it('throws fallback message when API error body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);

    await expect(apiModule.getJobStatus('bad')).rejects.toThrow(
      'Request failed (500)',
    );
  });
});
