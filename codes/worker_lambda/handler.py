"""SQS worker Lambda for asynchronous image compression."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from io import BytesIO
from urllib.parse import unquote_plus
from pathlib import PurePosixPath

from PIL import Image, ImageOps
import boto3
from botocore.exceptions import ClientError


logger = logging.getLogger()
logger.setLevel(logging.INFO)


DYNAMODB_TABLE: str = os.environ["DYNAMODB_TABLE"]
COMPRESSED_BUCKET: str = os.environ["COMPRESSED_BUCKET"]
DEFAULT_OUTPUT_FORMAT: str = os.environ.get("DEFAULT_OUTPUT_FORMAT", "WEBP").upper()
DEFAULT_QUALITY: int = int(os.environ.get("DEFAULT_QUALITY", "80"))

dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")
table = dynamodb.Table(DYNAMODB_TABLE)


SUPPORTED_OUTPUT_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}


class WorkerError(Exception):
    """Base class for worker failures."""


class RetryableWorkerError(WorkerError):
    """Errors that should be retried by SQS/Lambda."""


class NonRetryableWorkerError(WorkerError):
    """Errors that should not be retried."""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_int(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_format(value: object, filename: str) -> str:
    if isinstance(value, str) and value.strip():
        candidate = value.strip().upper()
        if candidate in SUPPORTED_OUTPUT_FORMATS:
            return "JPEG" if candidate == "JPG" else candidate

    if DEFAULT_OUTPUT_FORMAT in SUPPORTED_OUTPUT_FORMATS:
        return "JPEG" if DEFAULT_OUTPUT_FORMAT == "JPG" else DEFAULT_OUTPUT_FORMAT

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension in ("jpg", "jpeg"):
        return "JPEG"
    if extension in ("png",):
        return "PNG"
    if extension in ("webp",):
        return "WEBP"
    return "WEBP"


def _extract_s3_records(sqs_record: dict[str, object]) -> list[tuple[str, str]]:
    body_raw = sqs_record.get("body")
    if not isinstance(body_raw, str):
        raise NonRetryableWorkerError("SQS record body is missing or invalid.")

    try:
        body = json.loads(body_raw)
    except json.JSONDecodeError as exc:
        raise NonRetryableWorkerError("SQS record body is not valid JSON.") from exc

    if isinstance(body, dict) and isinstance(body.get("Message"), str):
        try:
            body = json.loads(body["Message"])
        except json.JSONDecodeError as exc:
            raise NonRetryableWorkerError("Nested SNS message is not valid JSON.") from exc

    if not isinstance(body, dict):
        raise NonRetryableWorkerError("Unexpected SQS payload type.")

    records = body.get("Records")
    if not isinstance(records, list):
        raise NonRetryableWorkerError("SQS payload does not include S3 records.")

    extracted: list[tuple[str, str]] = []
    for record in records:
        if not isinstance(record, dict):
            continue
        s3_data = record.get("s3")
        if not isinstance(s3_data, dict):
            continue
        bucket_data = s3_data.get("bucket")
        object_data = s3_data.get("object")
        if not isinstance(bucket_data, dict) or not isinstance(object_data, dict):
            continue

        bucket_name = bucket_data.get("name")
        object_key = object_data.get("key")
        if not isinstance(bucket_name, str) or not isinstance(object_key, str):
            continue

        extracted.append((bucket_name, unquote_plus(object_key)))

    if not extracted:
        raise NonRetryableWorkerError("No valid S3 object entries found in SQS record.")
    return extracted


def _job_identifiers_from_key(object_key: str) -> tuple[str, str, str]:
    parts = object_key.split("/")
    if len(parts) < 3 or not parts[0] or not parts[1]:
        raise NonRetryableWorkerError(
            f"Unexpected upload key format: '{object_key}'. Expected '<batch_id>/<job_id>/<filename>'."
        )

    batch_id = parts[0]
    job_id = parts[1]
    filename = parts[-1]
    return batch_id, job_id, filename


def _get_job(job_id: str) -> dict[str, object]:
    try:
        response = table.get_item(
            Key={"PK": f"JOB#{job_id}", "SK": "METADATA"},
            ConsistentRead=True,
        )
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to read job metadata: {exc.response['Error']['Message']}") from exc

    item = response.get("Item")
    if not isinstance(item, dict):
        raise NonRetryableWorkerError(f"Job '{job_id}' not found.")
    return item


def _get_batch_settings(batch_id: str) -> dict[str, object]:
    try:
        response = table.get_item(
            Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"},
            ConsistentRead=True,
        )
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to read batch metadata: {exc.response['Error']['Message']}") from exc

    item = response.get("Item")
    if not isinstance(item, dict):
        raise NonRetryableWorkerError(f"Batch '{batch_id}' not found.")

    settings = item.get("settings")
    if isinstance(settings, dict):
        return settings
    return {}


def _compress_image(
    source_bytes: bytes,
    filename: str,
    settings: dict[str, object],
) -> tuple[bytes, str]:
    try:
        image = Image.open(BytesIO(source_bytes))
    except Exception as exc:  # noqa: BLE001
        raise NonRetryableWorkerError("Uploaded object is not a valid image.") from exc

    with image:
        working = ImageOps.exif_transpose(image)
        output_format = _normalize_format(settings.get("format"), filename)
        quality = _to_int(settings.get("quality"))
        if quality is None:
            quality = DEFAULT_QUALITY
        quality = max(1, min(95, quality))

        max_width = _to_int(settings.get("max_width"))
        max_height = _to_int(settings.get("max_height"))
        if max_width is not None or max_height is not None:
            target_width = max_width if max_width and max_width > 0 else working.width
            target_height = max_height if max_height and max_height > 0 else working.height
            working.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)

        if output_format == "JPEG":
            if working.mode not in ("RGB", "L"):
                working = working.convert("RGB")

        output = BytesIO()
        save_kwargs: dict[str, object] = {}
        if output_format in {"JPEG", "WEBP"}:
            save_kwargs["quality"] = quality
            save_kwargs["optimize"] = True
        elif output_format == "PNG":
            save_kwargs["optimize"] = True

        try:
            working.save(output, format=output_format, **save_kwargs)
        except OSError as exc:
            raise NonRetryableWorkerError(f"Image save failed for format '{output_format}'.") from exc

    return output.getvalue(), output_format


def _content_type_for_format(output_format: str) -> str:
    if output_format == "JPEG":
        return "image/jpeg"
    if output_format == "PNG":
        return "image/png"
    return "image/webp"


def _extension_for_format(output_format: str) -> str:
    if output_format == "JPEG":
        return "jpg"
    if output_format == "PNG":
        return "png"
    return "webp"


def _compressed_filename(original_filename: str, output_format: str) -> str:
    safe_name = PurePosixPath(original_filename).name
    stem = safe_name.rsplit(".", 1)[0] if "." in safe_name else safe_name
    if not stem:
        stem = "image"
    return f"{stem}_compressed.{_extension_for_format(output_format)}"


def _mark_job_processing(job_id: str) -> None:
    try:
        table.update_item(
            Key={"PK": f"JOB#{job_id}", "SK": "METADATA"},
            UpdateExpression="SET #status = :processing, updated_at = :updated_at",
            ConditionExpression="#status IN (:pending, :queued, :processing)",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":processing": "PROCESSING",
                ":pending": "PENDING",
                ":queued": "QUEUED",
                ":updated_at": _now_iso(),
            },
        )
    except ClientError as exc:
        error_code = exc.response["Error"].get("Code")
        if error_code == "ConditionalCheckFailedException":
            return
        raise RetryableWorkerError(f"Failed to mark job as PROCESSING: {exc.response['Error']['Message']}") from exc


def _mark_job_completed(
    job_id: str,
    compressed_key: str,
    original_size: int,
    compressed_size: int,
) -> bool:
    try:
        table.update_item(
            Key={"PK": f"JOB#{job_id}", "SK": "METADATA"},
            UpdateExpression=(
                "SET #status = :completed, "
                "s3_compressed_key = :compressed_key, "
                "original_size_bytes = :original_size, "
                "compressed_size_bytes = :compressed_size, "
                "updated_at = :updated_at "
                "REMOVE error_message"
            ),
            ConditionExpression="#status IN (:pending, :queued, :processing)",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":completed": "COMPLETED",
                ":pending": "PENDING",
                ":queued": "QUEUED",
                ":processing": "PROCESSING",
                ":compressed_key": compressed_key,
                ":original_size": original_size,
                ":compressed_size": compressed_size,
                ":updated_at": _now_iso(),
            },
        )
    except ClientError as exc:
        error_code = exc.response["Error"].get("Code")
        if error_code == "ConditionalCheckFailedException":
            return False
        raise RetryableWorkerError(f"Failed to update completed job: {exc.response['Error']['Message']}") from exc
    return True


def _mark_job_failed(job_id: str, reason: str) -> bool:
    try:
        table.update_item(
            Key={"PK": f"JOB#{job_id}", "SK": "METADATA"},
            UpdateExpression=(
                "SET #status = :failed, error_message = :reason, updated_at = :updated_at"
            ),
            ConditionExpression="#status IN (:pending, :queued, :processing)",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":failed": "FAILED",
                ":pending": "PENDING",
                ":queued": "QUEUED",
                ":processing": "PROCESSING",
                ":reason": reason,
                ":updated_at": _now_iso(),
            },
        )
    except ClientError as exc:
        error_code = exc.response["Error"].get("Code")
        if error_code == "ConditionalCheckFailedException":
            return False
        raise RetryableWorkerError(f"Failed to mark job as failed: {exc.response['Error']['Message']}") from exc
    return True


def _increment_batch_counter(batch_id: str, counter_name: str) -> None:
    try:
        table.update_item(
            Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"},
            UpdateExpression=f"ADD {counter_name} :delta SET updated_at = :updated_at",
            ExpressionAttributeValues={
                ":delta": 1,
                ":updated_at": _now_iso(),
            },
        )
    except ClientError as exc:
        raise RetryableWorkerError(
            f"Failed to increment batch counter '{counter_name}': {exc.response['Error']['Message']}"
        ) from exc


def _refresh_batch_status(batch_id: str) -> None:
    try:
        response = table.get_item(
            Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"},
            ConsistentRead=True,
        )
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to read batch status: {exc.response['Error']['Message']}") from exc

    item = response.get("Item")
    if not isinstance(item, dict):
        raise NonRetryableWorkerError(f"Batch '{batch_id}' not found while refreshing status.")

    total_jobs = int(item.get("total_jobs", 0))
    completed_jobs = int(item.get("completed_jobs", 0))
    failed_jobs = int(item.get("failed_jobs", 0))

    if total_jobs > 0 and completed_jobs + failed_jobs >= total_jobs:
        status = "COMPLETED" if failed_jobs == 0 else "FAILED"
    elif completed_jobs > 0 or failed_jobs > 0:
        status = "PROCESSING"
    else:
        status = "PENDING"

    try:
        table.update_item(
            Key={"PK": f"BATCH#{batch_id}", "SK": "METADATA"},
            UpdateExpression="SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": status,
                ":updated_at": _now_iso(),
            },
        )
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to update batch status: {exc.response['Error']['Message']}") from exc


def _fetch_source_object(bucket: str, object_key: str) -> bytes:
    try:
        response = s3_client.get_object(Bucket=bucket, Key=object_key)
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to fetch source image: {exc.response['Error']['Message']}") from exc

    body = response.get("Body")
    if body is None:
        raise RetryableWorkerError("S3 object body was empty.")
    return body.read()


def _upload_compressed_object(
    compressed_bytes: bytes,
    compressed_key: str,
    output_format: str,
    download_filename: str,
) -> None:
    try:
        s3_client.put_object(
            Bucket=COMPRESSED_BUCKET,
            Key=compressed_key,
            Body=compressed_bytes,
            ContentType=_content_type_for_format(output_format),
            ContentDisposition=f'attachment; filename="{download_filename}"',
        )
    except ClientError as exc:
        raise RetryableWorkerError(f"Failed to store compressed image: {exc.response['Error']['Message']}") from exc


def _process_uploaded_object(bucket: str, object_key: str) -> None:
    batch_id, job_id, filename = _job_identifiers_from_key(object_key)

    job_item = _get_job(job_id)
    existing_status = str(job_item.get("status", ""))
    if existing_status in {"COMPLETED", "FAILED"}:
        logger.info("Skipping terminal job status=%s job_id=%s", existing_status, job_id)
        return

    if str(job_item.get("batch_id", "")) != batch_id:
        raise NonRetryableWorkerError(
            f"Batch mismatch for job '{job_id}': key has '{batch_id}', record has '{job_item.get('batch_id')}'."
        )

    _mark_job_processing(job_id)
    settings = _get_batch_settings(batch_id)

    try:
        source_bytes = _fetch_source_object(bucket, object_key)
        compressed_bytes, output_format = _compress_image(source_bytes, filename, settings)
    except NonRetryableWorkerError as exc:
        marked = _mark_job_failed(job_id, str(exc))
        if marked:
            _increment_batch_counter(batch_id, "failed_jobs")
            _refresh_batch_status(batch_id)
        logger.error(
            "Non-retryable image processing error batch_id=%s job_id=%s key=%s error=%s",
            batch_id,
            job_id,
            object_key,
            str(exc),
        )
        return

    compressed_name = _compressed_filename(filename, output_format)
    compressed_key = f"{batch_id}/{job_id}/{compressed_name}"
    _upload_compressed_object(
        compressed_bytes=compressed_bytes,
        compressed_key=compressed_key,
        output_format=output_format,
        download_filename=compressed_name,
    )

    job_updated = _mark_job_completed(
        job_id=job_id,
        compressed_key=compressed_key,
        original_size=len(source_bytes),
        compressed_size=len(compressed_bytes),
    )
    if not job_updated:
        logger.info("Skipping counter update for already-terminal job job_id=%s", job_id)
        return

    _increment_batch_counter(batch_id, "completed_jobs")
    _refresh_batch_status(batch_id)
    logger.info(
        "Compression completed batch_id=%s job_id=%s source_key=%s compressed_key=%s",
        batch_id,
        job_id,
        object_key,
        compressed_key,
    )


def _process_sqs_record(sqs_record: dict[str, object]) -> None:
    s3_items = _extract_s3_records(sqs_record)
    for bucket, object_key in s3_items:
        _process_uploaded_object(bucket, object_key)


def lambda_handler(event: dict[str, object], context: object) -> dict[str, list[dict[str, str]]]:
    records = event.get("Records")
    if not isinstance(records, list):
        logger.warning("Event did not include Records. event=%s", json.dumps(event))
        return {"batchItemFailures": []}

    batch_item_failures: list[dict[str, str]] = []

    for sqs_record in records:
        if not isinstance(sqs_record, dict):
            continue

        message_id_raw = sqs_record.get("messageId")
        message_id = message_id_raw if isinstance(message_id_raw, str) else "unknown-message-id"

        try:
            _process_sqs_record(sqs_record)
        except NonRetryableWorkerError as exc:
            logger.error("Dropping non-retryable message message_id=%s error=%s", message_id, str(exc))
        except RetryableWorkerError as exc:
            logger.exception("Retryable failure message_id=%s error=%s", message_id, str(exc))
            batch_item_failures.append({"itemIdentifier": message_id})
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unhandled failure message_id=%s error=%s", message_id, str(exc))
            batch_item_failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": batch_item_failures}
