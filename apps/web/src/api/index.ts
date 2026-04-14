/**
 * API Configuration and Types
 *
 * TODO: Replace these placeholder URLs with actual API Gateway endpoints
 * once the backend infrastructure is deployed.
 */

// API Gateway Base URL - TODO: Set this from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  /**
   * POST /upload-url
   * Request a presigned URL for direct S3 upload
   *
   * Request Body:
   * {
   *   filename: string;
   *   contentType: string;
   *   fileSize: number;
   * }
   *
   * Response:
   * {
   *   uploadUrl: string;       // Presigned S3 PUT URL
   *   objectKey: string;       // S3 object key for the uploaded file
   *   expiresIn: number;       // URL expiration in seconds
   * }
   */
  getUploadUrl: `${API_BASE_URL}/upload-url`,

  /**
   * POST /jobs
   * Submit a new compression job after file upload
   *
   * Request Body:
   * {
   *   objectKey: string;           // S3 key from upload
   *   compressionLevel: 'low' | 'medium' | 'high';
   *   outputFormat: 'original' | 'webp' | 'jpeg' | 'png';
   * }
   *
   * Response:
   * {
   *   jobId: string;
   *   status: 'pending';
   *   createdAt: string;        // ISO timestamp
   * }
   */
  submitJob: `${API_BASE_URL}/jobs`,

  /**
   * GET /jobs/:jobId
   * Get the status of a compression job
   *
   * Response:
   * {
   *   jobId: string;
   *   status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
   *   originalSize?: number;
   *   compressedSize?: number;
   *   compressionRatio?: number;
   *   error?: string;
   *   createdAt: string;
   *   updatedAt: string;
   * }
   */
  getJobStatus: (jobId: string) => `${API_BASE_URL}/jobs/${jobId}`,

  /**
   * GET /jobs/:jobId/download
   * Get a presigned download URL for the compressed image
   *
   * Response:
   * {
   *   downloadUrl: string;      // Presigned S3 GET URL
   *   filename: string;         // Suggested filename
   *   expiresIn: number;        // URL expiration in seconds
   * }
   */
  getDownloadUrl: (jobId: string) => `${API_BASE_URL}/jobs/${jobId}/download`,
} as const;

/**
 * Type definitions for API requests and responses
 */

// Upload URL
export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

// Submit Job
export interface SubmitJobRequest {
  objectKey: string;
  compressionLevel: 'low' | 'medium' | 'high';
  outputFormat: 'original' | 'webp' | 'jpeg' | 'png';
}

export interface SubmitJobResponse {
  jobId: string;
  status: 'pending';
  createdAt: string;
}

// Job Status
export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'expired';

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Download URL
export interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
}

/**
 * API Error response structure
 */
export interface ApiError {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Helper function to make API requests
 * TODO: Implement proper error handling and authentication
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a file directly to S3 using presigned URL
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
