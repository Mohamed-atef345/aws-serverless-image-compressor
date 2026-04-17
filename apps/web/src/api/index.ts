export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type HttpMethod = "GET" | "POST" | "PUT";

export interface UploadFileDescriptor {
  filename: string;
  content_type: string;
}

export interface UploadSettings {
  quality: number;
  format: "WEBP" | "JPEG" | "PNG";
  max_width: number;
}

export interface CreateBatchRequest {
  files: UploadFileDescriptor[];
  settings: UploadSettings;
}

export interface CreateBatchResponse {
  batch_id: string;
  jobs: Array<{
    job_id: string;
    filename: string;
    upload_url: string;
  }>;
}

export interface JobStatusResponse {
  job_id: string;
  batch_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  filename?: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BatchStatusResponse {
  batch_id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  progress_percent: number;
  created_at?: string;
  updated_at?: string;
}

export interface DownloadResponse {
  download_url: string;
  type: "single" | "zip";
  file_count?: number;
}

interface ApiErrorPayload {
  error?: string;
}

function ensureConfiguredBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured.");
  }
  return API_BASE_URL;
}

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const response = await fetch(`${ensureConfiguredBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.error) {
        errorMessage = payload.error;
      }
    } catch {
      // Keep fallback message
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export function createBatchUpload(requestBody: CreateBatchRequest): Promise<CreateBatchResponse> {
  return request<CreateBatchResponse>("/upload-url", "POST", requestBody);
}

export function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return request<JobStatusResponse>(`/jobs/${jobId}`, "GET");
}

export function getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
  return request<BatchStatusResponse>(`/batches/${batchId}`, "GET");
}

export function getBatchDownload(batchId: string): Promise<DownloadResponse> {
  return request<DownloadResponse>(`/batches/${batchId}/download`, "GET");
}

export async function uploadToPresignedUrl(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress((event.loaded / event.total) * 100);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error."));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}
