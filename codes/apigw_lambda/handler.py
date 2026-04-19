"""
API Gateway Lambda Handler — Image Compression Platform
========================================================
Handles all API Gateway proxy requests:
  POST /upload-url            → create batch + jobs, return presigned PUT URLs
  GET  /jobs/{jobId}          → return individual job status
  GET  /batches/{batchId}     → return aggregated batch status
  GET  /batches/{batchId}/download → return presigned download URL or zip URL

Runtime: Python 3.14
Dependencies: boto3 (provided by Lambda runtime)
"""

from __future__ import annotations

import json
import logging
import os
import uuid
import zipfile
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import PurePosixPath
from typing import Any

import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

DYNAMODB_TABLE: str = os.environ["DYNAMODB_TABLE"]
UPLOADS_BUCKET: str = os.environ["UPLOADS_BUCKET"]
COMPRESSED_BUCKET: str = os.environ["COMPRESSED_BUCKET"]
PRESIGNED_URL_TTL: int = int(os.environ.get("PRESIGNED_URL_TTL", "900"))
DDB_TTL_SECONDS: int = int(os.environ.get("DDB_TTL_SECONDS", "604800"))
MAX_FILE_SIZE_BYTES: int = int(os.environ.get("MAX_FILE_SIZE_BYTES", str(10 * 1024 * 1024)))
MAX_BATCH_SIZE_BYTES: int = int(os.environ.get("MAX_BATCH_SIZE_BYTES", str(30 * 1024 * 1024)))
MAX_BATCH_FILES: int = int(os.environ.get("MAX_BATCH_FILES", "5"))

# ---------------------------------------------------------------------------
# AWS clients (module-level for Lambda container reuse)
# ---------------------------------------------------------------------------

dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")
table = dynamodb.Table(DYNAMODB_TABLE)

# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

CORS_HEADERS: dict[str, str] = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}


def _ok(body: Any, status: int = 200) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def _error(message: str, status: int = 400) -> dict[str, Any]:
    logger.error("Returning %d: %s", status, message)
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": message}),
    }


# ---------------------------------------------------------------------------
# Route: POST /upload-url
# ---------------------------------------------------------------------------

def _handle_upload_url(body: dict[str, Any]) -> dict[str, Any]:
    """
    Body schema:
    {
      "files": [{"filename": "photo.jpg", "content_type": "image/jpeg"}, ...],
      "settings": {"quality": 80, "format": "WEBP", "max_width": 1920}
    }
    Returns:
    {
      "batch_id": "...",
      "jobs": [{"job_id": "...", "upload_url": "...", "filename": "..."}, ...]
    }
    """
    files: list[dict[str, Any]] = body.get("files", [])
    settings: dict[str, Any] = body.get("settings", {})

    if not files:
        return _error("'files' list is required and must not be empty.")

    if len(files) > MAX_BATCH_FILES:
        return _error(f"Maximum {MAX_BATCH_FILES} files per batch.")

    total_size_bytes = 0
    for file_info in files:
        file_size = file_info.get("size_bytes")
        if not isinstance(file_size, int) or file_size < 0:
            return _error("Each file must include a valid non-negative 'size_bytes' value.")

        if file_size > MAX_FILE_SIZE_BYTES:
            return _error(
                f"File '{file_info.get('filename', 'unknown')}' exceeds the maximum allowed size of "
                f"{MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
                413,
            )

        total_size_bytes += file_size

    if total_size_bytes > MAX_BATCH_SIZE_BYTES:
        return _error(
            f"Total batch size exceeds the maximum allowed {MAX_BATCH_SIZE_BYTES // (1024 * 1024)} MB.",
            413,
        )

    batch_id: str = str(uuid.uuid4())
    now_dt = datetime.now(timezone.utc)
    now: str = now_dt.isoformat()
    expires_at: int = int((now_dt + timedelta(seconds=DDB_TTL_SECONDS)).timestamp())
    jobs: list[dict[str, Any]] = []

    # Write batch record
    table.put_item(Item={
        "PK": f"BATCH#{batch_id}",
        "SK": "METADATA",
        "batch_id": batch_id,
        "status": "PENDING",
        "total_jobs": len(files),
        "completed_jobs": 0,
        "failed_jobs": 0,
        "settings": settings,
        "created_at": now,
        "updated_at": now,
        "expiresAt": expires_at,
    })

    for file_info in files:
        filename: str = file_info.get("filename", "image.jpg")
        content_type: str = file_info.get("content_type", "image/jpeg")
        job_id: str = str(uuid.uuid4())
        s3_key: str = f"{batch_id}/{job_id}/{filename}"

        # Write job record
        table.put_item(Item={
            "PK": f"JOB#{job_id}",
            "SK": "METADATA",
            "job_id": job_id,
            "batch_id": batch_id,
            "status": "PENDING",
            "filename": filename,
            "s3_upload_key": s3_key,
            "created_at": now,
            "updated_at": now,
            "expiresAt": expires_at,
        })

        # Generate presigned PUT URL
        upload_url: str = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": UPLOADS_BUCKET,
                "Key": s3_key,
                "ContentType": content_type,
            },
            ExpiresIn=PRESIGNED_URL_TTL,
        )

        jobs.append({
            "job_id": job_id,
            "filename": filename,
            "upload_url": upload_url,
        })

    logger.info("Created batch %s with %d jobs", batch_id, len(jobs))
    return _ok({"batch_id": batch_id, "jobs": jobs}, status=201)


# ---------------------------------------------------------------------------
# Route: GET /jobs/{jobId}
# ---------------------------------------------------------------------------

def _handle_get_job(job_id: str) -> dict[str, Any]:
    """Return the current status of a single compression job."""
    try:
        response = table.get_item(Key={"PK": f"JOB#{job_id}", "SK": "METADATA"})
    except ClientError as exc:
        logger.exception("DynamoDB error fetching job %s", job_id)
        return _error(f"Failed to retrieve job: {exc.response['Error']['Message']}", 500)

    item = response.get("Item")
    if not item:
        return _error(f"Job '{job_id}' not found.", 404)

    payload: dict[str, Any] = {
        "job_id": item["job_id"],
        "batch_id": item["batch_id"],
        "status": item["status"],
        "filename": item.get("filename"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }

    if item["status"] == "COMPLETED":
        payload["compressed_key"] = item.get("s3_compressed_key")
        payload["original_size_bytes"] = item.get("original_size_bytes")
        payload["compressed_size_bytes"] = item.get("compressed_size_bytes")

    if item["status"] == "FAILED":
        payload["error"] = item.get("error_message")

    return _ok(payload)


# ---------------------------------------------------------------------------
# Route: GET /batches/{batchId}
# ---------------------------------------------------------------------------

def _handle_get_batch(batch_id: str) -> dict[str, Any]:
    """Return the aggregated status of all jobs within a batch."""
    try:
        response = table.get_item(Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"})
    except ClientError as exc:
        logger.exception("DynamoDB error fetching batch %s", batch_id)
        return _error(f"Failed to retrieve batch: {exc.response['Error']['Message']}", 500)

    item = response.get("Item")
    if not item:
        return _error(f"Batch '{batch_id}' not found.", 404)

    total: int = int(item.get("total_jobs", 0))
    completed: int = int(item.get("completed_jobs", 0))
    failed: int = int(item.get("failed_jobs", 0))
    progress_pct: float = round((completed / total * 100), 1) if total > 0 else 0.0

    return _ok({
        "batch_id": item["batch_id"],
        "status": item["status"],
        "total_jobs": total,
        "completed_jobs": completed,
        "failed_jobs": failed,
        "progress_percent": progress_pct,
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    })


# ---------------------------------------------------------------------------
# Route: GET /batches/{batchId}/download
# ---------------------------------------------------------------------------

def _handle_batch_download(batch_id: str) -> dict[str, Any]:
    """
    - Single image: returns a presigned GET URL for the compressed file.
    - Multiple images: builds an in-memory ZIP (STORE mode) of all compressed
      files, uploads it to the compressed bucket, and returns a presigned GET URL.
    """
    try:
        batch_response = table.get_item(Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"})
    except ClientError as exc:
        logger.exception("DynamoDB error fetching batch %s", batch_id)
        return _error(f"Failed to retrieve batch: {exc.response['Error']['Message']}", 500)

    batch = batch_response.get("Item")
    if not batch:
        return _error(f"Batch '{batch_id}' not found.", 404)

    if batch["status"] != "COMPLETED":
        return _error(
            f"Batch is not fully completed yet (status: {batch['status']}). "
            "Check progress via GET /batches/{batchId}.",
            409,
        )

    # Query all job records for this batch
    job_items: list[dict[str, Any]] = []
    query_kwargs: dict[str, Any] = {
        "IndexName": "batch_id-index",
        "KeyConditionExpression": Key("batch_id").eq(batch_id),
        "FilterExpression": Attr("PK").begins_with("JOB#"),
    }

    while True:
        jobs_response = table.query(**query_kwargs)
        job_items.extend(jobs_response.get("Items", []))
        last_evaluated_key = jobs_response.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break
        query_kwargs["ExclusiveStartKey"] = last_evaluated_key

    if not job_items:
        return _error("No jobs found for this batch.", 404)

    completed_jobs = [
        j
        for j in job_items
        if j.get("status") == "COMPLETED" and j.get("s3_compressed_key")
    ]
    if not completed_jobs:
        return _error("No completed jobs found in this batch.", 404)

    # Single image → direct presigned URL
    if len(completed_jobs) == 1:
        s3_key: str = completed_jobs[0]["s3_compressed_key"]
        download_name = PurePosixPath(s3_key).name
        url: str = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": COMPRESSED_BUCKET,
                "Key": s3_key,
                "ResponseContentDisposition": f'attachment; filename="{download_name}"',
            },
            ExpiresIn=PRESIGNED_URL_TTL,
        )
        return _ok({"download_url": url, "type": "single"})

    # Multiple images → build in-memory ZIP (STORE = no compression overhead)
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_STORED) as zf:
        for job in completed_jobs:
            s3_key = job["s3_compressed_key"]
            filename: str = PurePosixPath(s3_key).name
            try:
                obj = s3_client.get_object(Bucket=COMPRESSED_BUCKET, Key=s3_key)
                zf.writestr(filename, obj["Body"].read())
            except ClientError:
                logger.warning("Skipping missing S3 key %s", s3_key)

    zip_key: str = f"zips/{batch_id}/compressed_images.zip"
    zip_buffer.seek(0)
    s3_client.put_object(
        Bucket=COMPRESSED_BUCKET,
        Key=zip_key,
        Body=zip_buffer.read(),
        ContentType="application/zip",
    )

    zip_url: str = s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": COMPRESSED_BUCKET,
            "Key": zip_key,
            "ResponseContentDisposition": f'attachment; filename="compressed_images_{batch_id}.zip"',
        },
        ExpiresIn=PRESIGNED_URL_TTL,
    )
    logger.info("Created ZIP for batch %s with %d images", batch_id, len(completed_jobs))
    return _ok({"download_url": zip_url, "type": "zip", "file_count": len(completed_jobs)})


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    method: str = event.get("httpMethod", "")
    path: str = event.get("path", "")
    path_params: dict[str, str] = event.get("pathParameters") or {}

    logger.info(
        "Request: method=%s path=%s requestId=%s",
        method,
        path,
        context.aws_request_id,
    )

    try:
        if method == "OPTIONS":
            return _ok({}, status=200)

        # POST /upload-url
        if method == "POST" and path == "/upload-url":
            raw_body: str = event.get("body") or "{}"
            try:
                body = json.loads(raw_body)
            except json.JSONDecodeError:
                return _error("Request body must be valid JSON.")
            return _handle_upload_url(body)

        # GET /jobs/{jobId}
        if method == "GET" and "jobId" in path_params:
            return _handle_get_job(path_params["jobId"])

        # GET /batches/{batchId}/download
        if method == "GET" and "batchId" in path_params and path.endswith("/download"):
            return _handle_batch_download(path_params["batchId"])

        # GET /batches/{batchId}
        if method == "GET" and "batchId" in path_params:
            return _handle_get_batch(path_params["batchId"])

        return _error(f"Route not found: {method} {path}", 404)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled exception: %s", exc)
        return _error("Internal server error.", 500)
