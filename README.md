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
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │     WAF     │──▶│ API Gateway  │──▶│        Lambda (API)             │ │
│  │             │    │   REST API   │    │   codes/apigw_lambda/handler.py │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
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
| API           | API Gateway (REST, Regional), WAF                             |
| API Lambda    | Python 3.14, boto3                                            |
| Worker Lambda | Python 3.14, Pillow (Lambda Layer), boto3                     |
| Queue         | SQS Standard, Dead Letter Queue                               |
| Database      | DynamoDB (single-table with `PK`/`SK`, `batch_id-index`, TTL) |
| Storage       | S3 buckets for frontend, uploads, and compressed output       |
| IaC           | Terraform 1.x, AWS Provider 6.39                              |
| CI/CD         | GitHub Actions with OIDC                                      |
| Observability | CloudWatch logs, X-Ray tracing                                |

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
│           ├── dynamodb/
│           ├── iam/
│           ├── lambda/
│           ├── route 53/
│           ├── sqs/
│           ├── storage/                  # scaffolded
│           └── vpc/                      # currently commented in root
├── docs/
│   └── infrastructure-guide.md
├── AGENTS.md
├── .gitignore
└── README.md
```

## Infrastructure Modules

### Implemented Modules

| Module        | Description                                                              | Key Resources                                                         |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `S3_buckets`  | Frontend, uploads, and processed buckets with encryption/versioning/CORS | `aws_s3_bucket`, versioning, SSE, CORS, upload notifications          |
| `cdn`         | CloudFront distribution with OAC, HTTPS redirect, custom 404 behavior    | `aws_cloudfront_distribution`, `aws_cloudfront_origin_access_control` |
| `acm`         | DNS-validated certificate for root and wildcard domain                   | `aws_acm_certificate`, validation records                             |
| `route 53`    | Alias routing from subdomain to CloudFront                               | Route53 record set                                                    |
| `dynamodb`    | Job and batch metadata table with GSI and TTL                            | `aws_dynamodb_table`                                                  |
| `api gateway` | REST resources, methods, integrations, deployment and stage              | API Gateway resources/methods/integrations/stage                      |
| `iam`         | Least-privilege IAM for API and worker Lambdas + CloudFront to S3 policy | IAM roles, policies, attachments                                      |
| `lambda`      | API Lambda and worker Lambda packaging/deployment                        | `aws_lambda_function`, event source mapping, layer association        |
| `sqs`         | Main queue, DLQ, redrive policies, and S3 send-message policy            | `aws_sqs_queue`, queue policy, redrive policy                         |

### Partially Implemented / Pending

| Module    | Current State               | What Remains                                                      |
| --------- | --------------------------- | ----------------------------------------------------------------- |
| `storage` | Scaffolded module directory | Lifecycle retention policy module if extracted from bucket module |
| `vpc`     | Implemented module code     | Enable in root when private networking is required                |

### Root Composition Notes

- Active modules in root `infrastructure/terraform/main.tf`: `dynamodb`, `s3_buckets`, `cdn`, `route53`, `acm`, `iam`, `api_gateway`, `lambda`, `sqs`.
- API Gateway invoke permissions are wired via `aws_lambda_permission` in root.
- Worker Lambda consumes SQS with `batch_size = 10`, `maximum_batching_window_in_seconds = 2`, and `ReportBatchItemFailures`.
- VPC module remains disabled in root for current deployment mode.

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

## Processing Flow

1. Client calls `POST /upload-url`.
2. API Lambda creates DynamoDB records and returns presigned S3 upload URLs.
3. Client uploads directly to S3 uploads bucket.
4. S3 `ObjectCreated` event is sent to SQS.
5. Worker Lambda reads SQS records, fetches source objects from S3, compresses/transcodes images, writes output to processed bucket, and updates DynamoDB job/batch state.
6. Client polls `GET /batches/{batchId}` and optionally `GET /jobs/{jobId}`.
7. On completion, client requests `GET /batches/{batchId}/download`.

Worker configuration:

- SQS batch size: 10
- Batching window: 2 seconds
- Lambda timeout: 120 seconds
- SQS visibility timeout: 900 seconds
- Max receive count: 3 (to DLQ)
- Partial batch response: enabled via `ReportBatchItemFailures`

## Frontend

Frontend is implemented in `apps/web` as a React single-page app.

Implemented features:

- Presigned upload flow integration with API and S3.
- Batch/job polling and progress visualization.
- Compression options exposed to user (`format`, `quality`, `max_width`).
- Download flow for single-image and multi-image outputs.

Pending frontend work:

- Authentication flow.
- Full responsive pass.
- Error-state UX and recovery paths.

## DevOps and CI/CD

Target pipeline:

- Pull request: lint, tests, security scans, infra checks, and Terraform plan.
- Main branch: OIDC auth, Terraform apply, frontend deploy, Lambda updates.

Planned tooling:

- `pre-commit` for `black`, `ruff`, and Terraform checks.
- Trivy and tfsec in CI.
- Infracost and deployment safety checks.

## Security

Implemented:

- Private S3 buckets with server-side encryption.
- CloudFront OAC with signed origin requests.
- IAM least-privilege roles for API and worker Lambda functions.
- Presigned upload/download architecture (no image payload through API Gateway).

Planned hardening:

- WAF policy refinement.
- API Gateway throttling and usage controls.
- Tightened CORS origins for production domains.

## Project Status

### Completed

- API Lambda module and handler.
- SQS module including DLQ and S3 notification policy.
- Worker Lambda module wiring (runtime, environment variables, SQS event source mapping).
- Worker Lambda handler implementation in `codes/worker_lambda/handler.py`.
- Worker IAM role/policy wiring.
- Core frontend upload and processing UX.

### In Progress

- Pillow layer build/rebuild lifecycle for deployment updates.
- Final infrastructure consistency checks and end-to-end validation.

### Not Started

- Shared package models/utilities (`packages/shared`).
- Unit and integration test suites.
- Full CI/CD workflows in `.github/workflows`.
- OpenAPI publication and docs finalization.

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

### 4) Run Frontend Locally

```bash
cd apps/web
bun install
bun run dev
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

### API Lambda Environment

| Variable            | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `DYNAMODB_TABLE`    | DynamoDB table for jobs and batches       |
| `UPLOADS_BUCKET`    | Upload bucket for presigned PUT URLs      |
| `COMPRESSED_BUCKET` | Output bucket for presigned download URLs |
| `PRESIGNED_URL_TTL` | Presigned URL expiration in seconds       |
| `DDB_TTL_SECONDS`   | Optional TTL horizon override for records |

### Worker Lambda Environment

| Variable                | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `DYNAMODB_TABLE`        | DynamoDB table for job and batch updates |
| `COMPRESSED_BUCKET`     | Destination bucket for compressed files  |
| `DEFAULT_OUTPUT_FORMAT` | Fallback output format (`WEBP`)          |
| `DEFAULT_QUALITY`       | Fallback quality setting (`80`)          |
