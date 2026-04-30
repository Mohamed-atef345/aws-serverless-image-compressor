# ImageCompress - AWS Serverless Image Compression Platform

ImageCompress is a serverless image compression platform on AWS. Users upload images from a React frontend, API Gateway issues presigned upload URLs, and an asynchronous S3 -> SQS -> Lambda worker pipeline compresses images and tracks progress in DynamoDB.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Infrastructure Modules](#infrastructure-modules)
- [API Endpoints](#api-endpoints)
- [Processing Flow](#processing-flow)
- [Frontend](#frontend)
- [DevOps and CI/CD](#devops-and-cicd)
- [Security](#security)
- [Project Status](#project-status)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │   React     │──▶│  CloudFront  │──▶│         S3 (Static)             │ │
│  │   (Vite)    │    │     CDN      │    │      apps/web/dist              │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 API LAYER                                   │
│  ┌──────────────┐    ┌─────────────────────────────────┐                    │
│  │ API Gateway  │──▶│        Lambda (API)             │                    │
│  │   REST API   │    │   codes/apigw_lambda/handler.py │                    │
│  └──────────────┘    └─────────────────────────────────┘                    │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING LAYER                                │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐  │
│  │ S3 (Upload) │──▶│     SQS      │──▶│      Lambda (Worker)            │  │
│  │   Event     │    │    Queue     │    │  codes/worker_lambda/handler.py │  │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘  │
│                            │                           │                     │
│                            ▼                           ▼                     │
│                     ┌──────────────┐         ┌─────────────────────────────┐ │
│                     │     DLQ      │         │       S3 (Compressed)       │ │
│                     │ Dead Letter  │         │        Output Bucket        │ │
│                     └──────────────┘         └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                               DynamoDB                                  │ │
│  │                        Jobs / Batches Table                             │ │
│  │        PK | SK | jobId | status | original_key | compressed_key | TTL   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Frontend      | React 19, Vite 6, TypeScript, TailwindCSS 3                   |
| CDN           | CloudFront (OAC), Route 53, ACM                               |
| API           | API Gateway (REST, Regional)                                  |
| API Lambda    | Python 3.14, boto3                                            |
| Worker Lambda | Python 3.14, Pillow (Lambda Layer), boto3                     |
| Queue         | SQS Standard, Dead Letter Queue                               |
| Database      | DynamoDB (single-table with `PK`/`SK`, `batch_id-index`, TTL) |
| Storage       | S3 buckets for frontend, uploads (Transfer Acceleration), and compressed output |
| IaC           | Terraform 1.x, AWS Provider 6.39                              |
| CI/CD         | GitHub Actions (PR checks + main deploy via OIDC)             |
| Observability | CloudWatch logs/alarms/dashboard + SNS alerts + X-Ray tracing |

## Repository Structure

```
image_compressor/
├── apps/
│   └── web/                              # React frontend
├── codes/
│   ├── apigw_lambda/
│   │   └── handler.py                    # API Lambda handler
│   └── worker_lambda/
│       └── handler.py                    # Worker Lambda handler
├── infrastructure/
│   └── terraform/
│       ├── main.tf                       # Root Terraform composition
│       ├── variables.tf
│       ├── outputs.tf
│       └── modules/
│           ├── S3_buckets/
│           ├── acm/
│           ├── api gateway/
│           ├── cdn/
│           ├── cloudwatch_dashboard/
│           ├── dynamodb/
│           ├── iam/
│           ├── lambda/
│           ├── route 53/
│           ├── sns/
│           ├── sqs/
│           ├── vpc/                      # currently commented in root
│           └── waf/
├── .gitignore
└── README.md
```

## Infrastructure Modules

### Implemented Modules

| Module                 | Description                                                              | Key Resources                                                         |
| ---------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `S3_buckets`           | Frontend, uploads, and processed buckets with encryption/versioning/CORS/lifecycle | `aws_s3_bucket`, versioning, SSE, CORS, lifecycle rules, Transfer Acceleration, upload notifications |
| `cdn`                  | CloudFront distribution with OAC, HTTPS redirect, custom 404 behavior    | `aws_cloudfront_distribution`, `aws_cloudfront_origin_access_control` |
| `acm`                  | DNS-validated certificate for root and wildcard domain                   | `aws_acm_certificate`, validation records                             |
| `route 53`             | Alias routing from subdomain to CloudFront                               | Route53 record set                                                    |
| `dynamodb`             | Job and batch metadata table with GSI and TTL                            | `aws_dynamodb_table`                                                  |
| `api gateway`          | REST resources, methods, integrations, deployment and stage              | API Gateway resources/methods/integrations/stage                      |
| `iam`                  | Least-privilege IAM for API and worker Lambdas + CloudFront to S3 policy | IAM roles, policies, attachments                                      |
| `lambda`               | API Lambda and worker Lambda packaging/deployment                        | `aws_lambda_function`, event source mapping, layer association        |
| `sns`                  | Ops alerts topic and email subscription                                  | `aws_sns_topic`, `aws_sns_topic_subscription`                         |
| `sqs`                  | Main queue, DLQ, redrive policies, and S3 send-message policy            | `aws_sqs_queue`, queue policy, redrive policy                         |
| `waf`                  | WAFv2 ACLs for CloudFront and API Gateway + associations/metrics         | `aws_wafv2_web_acl`, `aws_wafv2_web_acl_association`                  |
| `cloudwatch_dashboard` | Unified ops dashboard for metrics and logs                               | `aws_cloudwatch_dashboard`                                            |

### Partially Implemented / Pending

| Module | Current State           | What Remains                                       |
| ------ | ----------------------- | -------------------------------------------------- |
| `vpc`  | Implemented module code | Enable in root when private networking is required |

### Root Composition Notes

- Active modules in root `infrastructure/terraform/main.tf`: `dynamodb`, `s3_buckets`, `cdn`, `route53`, `acm`, `iam`, `api_gateway`, `lambda`, `sqs`, `sns`, `waf`, `cloudwatch_dashboard`.
- API Gateway invoke permissions are wired via `aws_lambda_permission` in root.
- Worker Lambda consumes SQS with `batch_size = 5`, `maximum_batching_window_in_seconds = 2`, and `ReportBatchItemFailures`.
- CloudWatch alarms are wired to SNS (`ops_alerts`) for email notifications.
- VPC module remains disabled in root for current deployment mode.
- Terraform remote state is configured with an S3 backend and lockfile (`use_lockfile = true`).

## API Endpoints

| Method | Endpoint                      | Description                                             |
| ------ | ----------------------------- | ------------------------------------------------------- |
| `POST` | `/upload-url`                 | Creates a batch and jobs; returns presigned upload URLs |
| `GET`  | `/jobs/{jobId}`               | Returns one job status                                  |
| `GET`  | `/batches/{batchId}`          | Returns aggregate batch status                          |
| `GET`  | `/batches/{batchId}/download` | Returns single file or zip download URL                 |

Notes:

- API integrations use `AWS_PROXY`.
- CORS preflight `OPTIONS` routes use `MOCK` integrations.
- Upload guardrails: max `5` files per batch, max `10 MB` per file, and max `30 MB` total batch size.

## Processing Flow

1. Client calls `POST /upload-url`.
2. API Lambda creates DynamoDB records and returns presigned S3 upload URLs (using S3 Transfer Acceleration endpoint for faster uploads).
3. Client uploads directly to S3 uploads bucket via the accelerated endpoint.
4. S3 `ObjectCreated` event is sent to SQS.
5. Worker Lambda reads SQS records, fetches source objects from S3, compresses/transcodes images, writes output to processed bucket using `<original_name>_compressed.<ext>` naming, and updates DynamoDB job/batch state.
6. Client polls `GET /batches/{batchId}` and optionally `GET /jobs/{jobId}`.
7. On completion, client requests `GET /batches/{batchId}/download`.

Worker configuration:

- SQS batch size: 5
- Batching window: 2 seconds
- Lambda timeout: 120 seconds
- Worker Lambda memory: 512 MB
- SQS visibility timeout: 120 seconds
- Max receive count: 3 (to DLQ)
- Partial batch response: enabled via `ReportBatchItemFailures`

## Frontend

Frontend is implemented in `apps/web` as a React single-page app.

Implemented features:

- Presigned upload flow integration with API and S3 (via Transfer Acceleration).
- Batch/job polling and progress visualization.
- Compression options exposed to user (`format`, `quality`, `max_width`).
- Upload validation guardrails in the client (max `5` files, `10 MB` per file, `30 MB` batch total).
- Premium settings panel redesign for format, quality, and max-width controls with explanatory labels.
- Download flow for single-image and multi-image outputs, including forced browser download behavior.
- **UI locking during uploads**: drop zone, file input, "+ Add more" button, file removal buttons, and all settings dropdowns are disabled while an upload/processing operation is in progress to prevent race conditions.
- **Processing overlay via React Portal**: the compression progress overlay renders through `createPortal` into `document.body`, ensuring it always appears above all page content regardless of parent z-index stacking contexts.
- Frontend unit tests with Vitest and Testing Library (`npm run test:ci`).

Pending frontend work:

- Authentication flow.
- Full responsive pass.
- Error-state UX and recovery paths.

## DevOps and CI/CD

Implemented DevOps features:

- **Terraform architecture**: modular IaC in `infrastructure/terraform/modules` for `S3_buckets`, `cdn`, `acm`, `route 53`, `dynamodb`, `api gateway`, `iam`, `lambda`, and `sqs`.
- **State management**: remote Terraform state via S3 backend with lockfile locking enabled (`use_lockfile = true`).
- **Edge + DNS delivery**: CloudFront distribution with OAC, ACM certificate validation, and Route53 alias record to `compression.<domain>`.
- **Storage setup**: dedicated frontend/uploads/processed S3 buckets with SSE (`AES256`), CORS rules restricted to `compression.myshortly.tech`, S3 event notifications from uploads bucket to SQS, **S3 Transfer Acceleration** enabled on the uploads bucket for faster global uploads, and **lifecycle rules** (uploads auto-deleted after 1 day, compressed files auto-deleted after 7 days).
- **Async processing pipeline**: SQS main queue + DLQ + redrive policy, then worker Lambda event source mapping with `batch_size = 5`, `maximum_batching_window_in_seconds = 2`, and `ReportBatchItemFailures`.
- **Lambda packaging/runtime**: API and worker functions are packaged with Terraform `archive_file`; worker uses a Pillow Lambda layer zip and runs with `python3.14`, `120s` timeout, and `512 MB` memory.
- **IAM least privilege**: separate API/worker Lambda roles with scoped S3, DynamoDB, SQS, and CloudWatch Logs permissions; worker role also includes X-Ray publish permissions.
- **API deployment plumbing**: API Gateway REST resources/methods/integrations/stage are provisioned in Terraform with Lambda invoke permissions from API Gateway.
- **Edge and API protection**: WAFv2 ACLs are attached to both CloudFront and API Gateway with managed rule groups and rate limiting.
- **Observability baseline**: X-Ray active tracing is enabled for API Gateway and both Lambdas.
- **CloudWatch monitoring**: log groups with retention, service alarms (Lambda, API Gateway, SQS/DLQ, DynamoDB, CloudFront, WAF), SNS alert routing, and a centralized CloudWatch dashboard module.

### CI/CD Pipelines

Fully implemented GitHub Actions workflows:

- **PR Checks** (`.github/workflows/pr-checks.yml`): Triggers on push to any branch except `main`. Uses `dorny/paths-filter` to detect changes and conditionally runs:
  - **Frontend tests**: installs dependencies and runs `npm run test:ci` (Vitest).
  - **Lambda code checks**: syntax-checks Python code via `compileall` in a Docker container.
  - **Infrastructure tests**: authenticates via OIDC, builds the Pillow Lambda layer, runs `terraform init`, `fmt -check`, `validate`, and `plan`.
  - **Auto PR + merge**: if all checks pass, automatically creates a PR (if missing) and enables squash auto-merge.
  - Concurrency control cancels in-progress runs on the same branch.

- **Main Deploy** (`.github/workflows/main-deploy.yml`): Triggers on push to `main` or via manual `workflow_dispatch`. Authenticates via OIDC, builds the Pillow Lambda layer, runs `terraform apply -auto-approve`, exports Terraform outputs (API URL, bucket name, CloudFront distribution ID) as job outputs, saves all outputs as a downloadable JSON artifact, then builds and deploys the frontend to S3 with CloudFront cache invalidation. The `VITE_API_BASE_URL` is automatically injected from Terraform output at build time.

## Security

Implemented:

- Private S3 buckets with server-side encryption.
- CloudFront OAC with signed origin requests.
- IAM least-privilege roles for API and worker Lambda functions.
- Presigned upload/download architecture (no image payload through API Gateway).
- WAFv2 attached to CloudFront and API Gateway.
- CloudWatch + SNS alerting pipeline for operational events.
- CORS origins restricted to production domain (`compression.myshortly.tech`).
- S3 lifecycle rules to auto-delete temporary files (uploads: 1 day, compressed: 7 days).

## Project Status

### Completed

- API Lambda module and handler (with dual S3 clients: standard for downloads, accelerated for uploads).
- SQS module including DLQ and S3 notification policy.
- Worker Lambda module wiring (runtime, environment variables, SQS event source mapping).
- Worker Lambda handler implementation in `codes/worker_lambda/handler.py`.
- Worker IAM role/policy wiring.
- CloudFront + ACM + Route53 infrastructure wiring for frontend delivery.
- WAFv2 implementation and association for both CloudFront and API Gateway.
- CloudWatch alarms across Lambda, API Gateway, SQS/DLQ, DynamoDB, CloudFront, and WAF.
- SNS ops topic + email subscription integration for alarm notifications.
- Centralized CloudWatch dashboard module for metrics and logs widgets.
- Terraform remote state backend configuration with locking.
- Core frontend upload and processing UX.
- S3 Transfer Acceleration enabled on uploads bucket.
- S3 lifecycle rules for automatic file cleanup.
- CORS origins restricted to production domain.
- CI/CD pipelines: PR checks workflow and main deploy workflow (with frontend build + deploy).
- Frontend UI locking during active uploads/processing.
- Processing overlay rendered via React Portal for correct z-index layering.
- Frontend unit tests with Vitest.

### Future Enhancements

- API Gateway throttling (usage plans + method-level limits).
- Structured JSON logging via `aws_lambda_powertools`.
- Pydantic v2 input validation at API boundaries.
- pytest + moto unit tests for Lambda handlers.
- CI security scans (Trivy, tfsec, Infracost).
- Pre-commit hooks (black, ruff, terraform fmt).
- OpenAPI/Swagger API documentation.
- Frontend authentication flow.
- Full responsive design pass.

## Getting Started

### Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Node.js >= 18 (or Bun)
- Python 3.14
- Docker (required to build Lambda-compatible Pillow layer)

### 1) Clone

```bash
git clone https://github.com/Mohamed-atef345/aws-serverless-image-compressor.git
cd aws-serverless-image-compressor
```

### 2) Build Pillow Lambda Layer

Run from repository root:

```bash
mkdir -p layer/python
docker run --rm -v "$PWD/layer:/var/task/layer" public.ecr.aws/sam/build-python3.14:latest \
  /bin/sh -c "pip install --no-cache-dir pillow -t /var/task/layer/python"
(cd layer && zip -r ../infrastructure/terraform/modules/lambda/pillow_layer.zip python)
```

### 3) Deploy Infrastructure

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

After apply, you can print the dashboard name for pipeline/ops usage:

```bash
terraform output cloudwatch_dashboard_name
```

### 4) Run Frontend Locally

```bash
cd apps/web
npm install
npm run dev
```

## Environment Variables

### Terraform Inputs (selected)

| Variable                    | Default                              |
| --------------------------- | ------------------------------------ |
| `aws_region`                | `us-east-1`                          |
| `frontend_bucket_name`      | `image-compression-frontend-bucket`  |
| `uploads_bucket_name`       | `image-compression-uploads-bucket`   |
| `processed_bucket_name`     | `image-compression-processed-bucket` |
| `table_name`                | `imageCompressionMetadata`           |
| `message_retention_seconds` | `10800`                              |
| `maxReceiveCount`           | `3`                                  |
| `admin_email`               | no default (required)                |
| `cloudwatch_dashboard_name` | `image-compressor-ops-overview`      |

### API Lambda Environment

| Variable               | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `DYNAMODB_TABLE`       | DynamoDB table for jobs and batches                       |
| `UPLOADS_BUCKET`       | Upload bucket for presigned PUT URLs                      |
| `COMPRESSED_BUCKET`    | Output bucket for presigned download URLs                 |
| `PRESIGNED_URL_TTL`    | Presigned URL expiration in seconds                       |
| `DDB_TTL_SECONDS`      | Optional TTL horizon override for records                 |
| `MAX_FILE_SIZE_BYTES`  | Max allowed size for a single upload (default 10 MB)      |
| `MAX_BATCH_SIZE_BYTES` | Max allowed size for all files in a batch (default 30 MB) |
| `MAX_BATCH_FILES`      | Max files per batch (configured as `5`)                   |

### Frontend Environment

| Variable            | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | Base URL for API requests from the web app. |

### Worker Lambda Environment

| Variable                | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `DYNAMODB_TABLE`        | DynamoDB table for job and batch updates |
| `COMPRESSED_BUCKET`     | Destination bucket for compressed files  |
| `DEFAULT_OUTPUT_FORMAT` | Fallback output format (`WEBP`)          |
| `DEFAULT_QUALITY`       | Fallback quality setting (`80`)          |
