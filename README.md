# 🖼️ ImageCompress — AWS Serverless Image Compression Platform

A production-grade, fully serverless image compression platform built on AWS. Users upload images through a modern React frontend, and an asynchronous processing pipeline compresses them using AWS Lambda workers triggered via SQS. The entire infrastructure is managed as code with Terraform and deployed via GitHub Actions CI/CD with OIDC authentication.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Infrastructure Modules](#-infrastructure-modules)
- [API Endpoints](#-api-endpoints)
- [Processing Flow](#-processing-flow)
- [Frontend](#-frontend)
- [DevOps & CI/CD](#-devops--cicd)
- [Security](#-security)
- [Project Status](#-project-status)
  - [What's Done](#-whats-done)
  - [In Progress](#%EF%B8%8F-in-progress)
  - [Not Started](#-not-started)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  FRONTEND                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │   React     │───▶│  CloudFront  │───▶│         S3 (Static)           │ │
│  │   (Vite)    │    │     CDN      │    │      apps/web/dist              │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 API LAYER                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │     WAF     │───▶│ API Gateway  │───▶│        Lambda (API)           │ │
│  │             │    │   REST API   │    │   codes/apigw_lambda/handler.py │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING LAYER                               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │ S3 (Upload) │───▶│     SQS     │───▶│      Lambda (Worker)           │ │
│  │   Event     │    │    Queue     │    │  services/worker/handler.py     │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
│                            │                           │                    │
│                            ▼                           ▼                    │
│                     ┌──────────────┐         ┌─────────────────────────────┐│
│                     │     DLQ      │         │    S3 (Compressed)          ││
│                     │ Dead Letter  │         │    Output Bucket            ││
│                     └──────────────┘         └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          DynamoDB                                       ││
│  │                   Jobs / Batches Table                                  ││
│  │   PK | SK | jobId | status | original_key | compressed_key | TTL        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧰 Technology Stack

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| **Frontend**      | React 19 + Vite 6 + TypeScript + TailwindCSS 3     |
| **CDN**           | CloudFront (OAC) + Route 53 + ACM (SSL)            |
| **API**           | API Gateway (REST, Regional) + WAF                 |
| **API Lambda**    | Python 3.14, boto3                                 |
| **Worker Lambda** | Python 3.14, Pillow (planned)                      |
| **Queue**         | SQS (Standard) + Dead Letter Queue                 |
| **Database**      | DynamoDB (PAY_PER_REQUEST, single-table design)    |
| **Storage**       | S3 — 3 buckets (frontend, uploads, compressed)     |
| **IaC**           | Terraform 1.x (AWS Provider 6.39, remote S3 state) |
| **CI/CD**         | GitHub Actions (OIDC auth, no stored secrets)      |
| **Security**      | WAF, OAC, SSE-AES256, least-privilege IAM          |
| **Observability** | X-Ray tracing, CloudWatch structured JSON logging  |
| **Docs**          | OpenAPI / Swagger                                  |

---

## 📁 Project Structure

```
image_compressor/
├── apps/
│   └── web/                          # React frontend (Vite + TypeScript)
│       ├── src/
│       │   ├── api/
│       │   │   └── index.ts          # API Gateway client + typed contracts
│       │   ├── components/
│       │   │   ├── ProcessingAnimation.tsx
│       │   │   ├── ProcessingOverlay.tsx
│       │   │   ├── UploadInput.tsx   # Upload + polling + download flow
│       │   │   └── ...
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       └── ...
├── codes/
│   └── apigw_lambda/
│       └── handler.py                # API Lambda handler implementation
├── infrastructure/
│   └── terraform/
│       ├── main.tf                   # Root module composition
│       ├── backend.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── modules/
│           ├── S3_buckets/
│           ├── cdn/
│           ├── acm/
│           ├── route 53/
│           ├── iam/
│           ├── dynamodb/
│           ├── api gateway/
│           ├── lambda/               # API Lambda packaging + resource
│           ├── vpc/                  # Present, currently commented in root
│           ├── sqs/                  # Empty (planned)
│           └── storage/              # Empty (planned)
├── docs/
│   └── infrastructure-guide.md
├── AGENTS.md
├── .gitignore
└── README.md
```

---

## 🧱 Infrastructure Modules

The infrastructure is organized into reusable Terraform modules. Below is the status and description of each module:

### ✅ Implemented in Code

| Module          | Description                                                                              | Key Resources                             |
| --------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| **S3_buckets**  | Three S3 buckets with SSE-AES256 and CORS for direct upload/download flows               | frontend/uploads/processed buckets        |
| **cdn**         | CloudFront distribution with OAC, HTTPS redirect, cache behaviors, custom 404 response   | CloudFront distribution + OAC             |
| **acm**         | ACM cert for `myshortly.tech` + wildcard SAN, DNS-validated via Route 53                 | Cert + validation records                 |
| **route 53**    | Alias record for `compression.myshortly.tech` to CloudFront                              | Route53 alias record                      |
| **iam**         | CloudFront bucket policy + API Lambda execution role/policy                              | Bucket policy + Lambda IAM role/policy    |
| **dynamodb**    | Jobs/batches table (`PK`/`SK`) with `batch_id-index` GSI and TTL on `expiresAt`          | DynamoDB table + GSI                      |
| **api gateway** | REST API with Lambda proxy routes + OPTIONS methods for CORS + deployment and `v1` stage | API resources/methods/integrations/stage  |
| **lambda**      | API Lambda packaging and deployment from `codes/apigw_lambda`                            | `aws_lambda_function` + archive packaging |
| **vpc**         | VPC module code exists (2 public + 2 private subnets, NAT, IGW, route tables)            | Not enabled in root currently             |

### ⚠️ Modules Created but Empty

| Module      | Description                                 | Status                           |
| ----------- | ------------------------------------------- | -------------------------------- |
| **sqs**     | SQS queue + DLQ for async worker processing | Directory exists, no `.tf` files |
| **storage** | Lifecycle/retention helper module           | Directory exists, no `.tf` files |

### ℹ️ Root Module Notes

- Active modules in root `main.tf`: `dynamodb`, `s3_buckets`, `cdn`, `route53`, `acm`, `iam`, `api_gateway`, `apigw_lambda`
- `aws_lambda_permission` is defined in root to allow API Gateway invoke
- **VPC** module is present but currently commented out in root `main.tf`
- Backend state stored in S3 bucket `terraform-backend-bucket-017777088168-us-east-1-an`
- AWS Provider version locked to `6.39.0`

---

## 📡 API Endpoints

| Method | Endpoint                      | Description                                          |
| ------ | ----------------------------- | ---------------------------------------------------- |
| `POST` | `/upload-url`                 | Create batch + jobs, return presigned S3 upload URLs |
| `GET`  | `/jobs/{jobId}`               | Get individual job status                            |
| `GET`  | `/batches/{batchId}`          | Get aggregated batch status                          |
| `GET`  | `/batches/{batchId}/download` | Get download link (single file or zip archive)       |

> **Note:** Endpoints use `AWS_PROXY` Lambda integration. `OPTIONS` methods are configured with `MOCK` integration for CORS preflight responses.

---

## ⚙️ Processing Flow

```
1. Client → POST /upload-url
   └─ API Lambda creates batch + job records in DynamoDB
   └─ Returns batch_id + presigned S3 upload URLs

2. Client → PUT (direct S3 upload via presigned URL)
   └─ File uploaded directly to uploads bucket (never through API Gateway)

3. S3 PutObject event → SQS → Worker Lambda
   └─ Worker reads original image from uploads bucket
   └─ Compresses using Pillow (configurable level + format)
   └─ Writes compressed image to processed bucket
   └─ Updates job status in DynamoDB

4. Client → GET /batches/{batchId}
   └─ Polls for completion status

5. Client → GET /batches/{batchId}/download
   └─ Returns presigned download URL
   └─ Multi-image: generates zip (STORE mode) → presigned URL
```

**Worker Configuration:**

- Batch size: 1–10 messages per Lambda invocation
- Worker Lambda timeout: 120s
- SQS visibility timeout: 900s (≥ 6× Lambda timeout)
- Max receive count: 3 → messages sent to DLQ after 3 failures
- Workers are designed to be **idempotent**

---

## 🎨 Frontend

The frontend is a **React 19 + Vite 6** single-page application with a modern, polished UI:

### Implemented Features

- **Navigation bar** with logo, menu items (Features, How It Works, Contact), Sign Up / Log In buttons
- **Hero section** with headline, subtitle, and feature pills (Up to 90% smaller, Secure & Private, Instant Results)
- **Upload component** with:
  - Drag & drop zone with visual feedback
  - Click to browse files
  - Multi-file list, per-file size display, remove action
  - Validation for supported image types and max file size
  - Compression settings (format/quality/max width)
  - Upload progress bar
  - Completion screen + download button
- **Compression settings** dropdowns:
  - Format: WebP / JPEG / PNG
  - Quality and max width options
- **API integration** (`src/api/index.ts`) wired to API Gateway:
  - `POST /upload-url` to create batch + receive presigned upload URLs
  - Direct file upload to S3 via presigned URLs
  - Polling `GET /batches/{batchId}` and `GET /jobs/{jobId}`
  - Final download via `GET /batches/{batchId}/download`
- **Processing UX**
  - Full-screen processing overlay
  - Custom canvas-based animation inspired by coding assistant loaders
  - Live status list per file + rolling processing log
- **Animated dark/gold visual theme** with dynamic background and glassmorphism
- **Custom Google Fonts**: Schibsted Grotesk, Inter, Noto Sans, Fustat
- Custom scrollbar styling, animations (fade-in, dropdown), and focus-visible outlines

### Not Yet Implemented (Frontend)

- Authentication UI (Sign Up / Log In are non-functional)
- Full responsive/mobile optimization pass
- Error handling UI
- 404 page

---

## 🔧 DevOps & CI/CD

### Planned CI/CD Pipeline

| Stage         | Trigger        | Steps                                                                                             |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| **PR Checks** | Pull Request   | Lint → pytest → Trivy scan → tfsec scan → Infracost → terraform plan                              |
| **Deploy**    | Push to `main` | OIDC auth → terraform apply → build frontend → S3 sync → CloudFront invalidation → deploy Lambdas |

### Planned DevOps Tooling

| Tool             | Purpose                                       | Status         |
| ---------------- | --------------------------------------------- | -------------- |
| **OIDC**         | GitHub Actions → AWS auth (no stored secrets) | 🔴 Not started |
| **Trivy**        | Docker image CVE scanning in CI               | 🔴 Not started |
| **tfsec**        | Terraform security misconfiguration scanning  | 🔴 Not started |
| **Infracost**    | Cost estimate comments on PRs                 | 🔴 Not started |
| **pre-commit**   | black, ruff, terraform fmt/validate           | 🔴 Not started |
| **ECR Scanning** | CVE scanning for pushed Docker images         | 🔴 Not started |
| **Makefile**     | One-command deploy, destroy, test, lint       | 🔴 Not started |

---

## 🔒 Security

### Implemented

- ✅ S3 buckets: public access fully blocked (all 4 public access block settings)
- ✅ S3: Server-side encryption (AES256) on all buckets
- ✅ CloudFront → S3: Origin Access Control (OAC) with `sigv4` signing
- ✅ CloudFront: HTTPS-only (`redirect-to-https`)
- ✅ ACM: Wildcard SSL certificate with DNS validation
- ✅ `.gitignore`: Terraform state, `.env` files, secrets excluded

### Planned

- 🔲 WAF rules on API Gateway
- 🔲 Presigned URLs ≤ 15 min expiration
- 🔲 Least-privilege IAM roles for Lambda functions
- 🔲 API Gateway throttling (usage plan + method-level limits)
- 🔲 CORS configuration (currently `*` origins — needs more restriction)
- 🔲 Cognito / API Key authentication

---

## 📊 Project Status

### ✅ What's Done

| Component                  | Details                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Architecture**   | Full architecture designed and documented in `AGENTS.md`                                                                                      |
| **Infrastructure Guide**   | Comprehensive 1500-line guide covering all AWS services, Terraform configs, CI/CD, and environment variables (`docs/infrastructure-guide.md`) |
| **S3 Buckets Module**      | 3 buckets (frontend, uploads, processed) with SSE, versioning, account-regional naming — **deployed**                                         |
| **CloudFront CDN Module**  | Distribution with OAC, HTTPS redirect, custom 404, cache behaviors, PriceClass_200 — **deployed**                                             |
| **ACM Module**             | SSL certificate for `myshortly.tech` + `*.myshortly.tech` with Route 53 DNS validation — **deployed**                                         |
| **Route 53 Module**        | A-record alias `compression.myshortly.tech` → CloudFront — **deployed**                                                                       |
| **IAM Module**             | CloudFront → S3 bucket policy for frontend access — **deployed**                                                                              |
| **Terraform Remote State** | S3 backend with native lockfile support, AWS Provider 6.39.0                                                                                  |
| **DynamoDB Module**        | Table with PK/SK, `batch_id-index`, TTL (`expiresAt`) — wired in root                                                                         |
| **API Gateway Module**     | `POST /upload-url`, `GET /jobs/{jobId}`, `GET /batches/{batchId}`, `GET /batches/{batchId}/download`, plus CORS OPTIONS                       |
| **API Lambda Module**      | Terraform module creates API Lambda from `codes/apigw_lambda` with env vars + invoke wiring                                                   |
| **API Lambda Handler**     | Batch creation, job status, batch status, single/zip download, pagination-safe batch query, TTL writes, CORS headers                          |
| **Frontend Integration**   | Real API flow implemented: create batch, upload to S3, poll statuses, show processing overlay, download output                                |
| **VPC Module**             | Full VPC module exists but still commented in root                                                                                            |
| **`.gitignore`**           | Properly configured for Terraform, Node.js, env files, build artifacts                                                                        |

### 🛠️ In Progress

| Component                 | Details                                                            | What Remains                                                                                   |
| ------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Root Terraform Wiring** | Core modules are wired (`dynamodb`, `api_gateway`, `apigw_lambda`) | Enable VPC when needed, then run full end-to-end infra checks                                  |
| **SQS Module**            | Directory created at `modules/sqs/`                                | Write `main.tf` for compression queue + DLQ + S3 event notification + SQS policy               |
| **Worker Lambda Module**  | API Lambda is implemented; worker pipeline is not                  | Add worker Lambda, SQS event source mapping, and DLQ handling                                  |
| **Storage Module**        | Directory created at `modules/storage/`                            | Lifecycle rules (1-day upload expiry, 7-day compressed expiry), CORS config for uploads bucket |

### 🔴 Not Started

| Component                                       | Description                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Worker Lambda Handler** (`services/worker/`)  | Python 3.14 handler: image compression with Pillow, DynamoDB status updates, S3 read/write |
| **Shared Packages** (`packages/shared/`)        | Pydantic v2 models, shared schemas, custom exceptions, constants                           |
| **Unit Tests** (`tests/unit/`)                  | pytest + moto for API and Worker Lambda handlers                                           |
| **Integration Tests** (`tests/integration/`)    | Cross-service tests (API → SQS → Worker → S3 → DynamoDB)                                   |
| **GitHub Actions CI/CD** (`.github/workflows/`) | OIDC auth, terraform plan/apply, frontend build → S3 sync, Lambda deployment               |
| **Makefile**                                    | One-command `deploy`, `destroy`, `test`, `lint`, `fmt`                                     |
| **pre-commit Config**                           | black, ruff, terraform fmt/validate hooks                                                  |
| **OpenAPI Spec** (`docs/`)                      | Swagger/OpenAPI documentation for all API endpoints                                        |
| **Frontend Auth UI**                            | Sign Up / Log In flows (Cognito integration)                                               |
| **Frontend Responsive Design**                  | Mobile and tablet layouts                                                                  |
| **Frontend Error Handling**                     | Error boundaries, toast notifications, retry logic                                         |
| **WAF Configuration**                           | Web Application Firewall rules for API Gateway                                             |
| **API Gateway Throttling**                      | Usage plans, method-level rate limits                                                      |
| **CloudWatch Dashboards**                       | Operational dashboards for Lambda, SQS, API Gateway metrics                                |
| **Monitoring & Alerting**                       | CloudWatch Alarms, SNS notifications for DLQ messages, Lambda errors                       |

---

## 🚀 Getting Started

### Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) ≥ 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Node.js](https://nodejs.org/) ≥ 18 (or [Bun](https://bun.sh/))
- [Python](https://www.python.org/) 3.14
- An AWS account with Route 53 hosted zone for your domain

### 1. Clone the Repository

```bash
git clone https://github.com/Mohamed-atef345/aws-serverless-image-compressor.git
cd aws-serverless-image-compressor
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### 3. Run the Frontend Locally

```bash
cd apps/web
bun install   # or npm install
bun run dev   # starts on http://localhost:3000
```

### 4. Deploy (Future — via CI/CD)

```bash
# Once CI/CD is set up:
git push origin main   # triggers automated deployment
```

---

## 🔐 Environment Variables

### Terraform Variables (with defaults)

| Variable                | Default                              | Description                            |
| ----------------------- | ------------------------------------ | -------------------------------------- |
| `aws_region`            | `us-east-1`                          | AWS region                             |
| `domain_name`           | `myshortly.tech`                     | Root domain for the project            |
| `frontend_bucket_name`  | `image-compression-frontend-bucket`  | Frontend S3 bucket name prefix         |
| `uploads_bucket_name`   | `image-compression-uploads-bucket`   | Uploads S3 bucket name prefix          |
| `processed_bucket_name` | `image-compression-processed-bucket` | Processed images S3 bucket name prefix |
| `table_name`            | `imageCompressionMetadata`           | DynamoDB table name                    |
| `billing_mode`          | `PAY_PER_REQUEST`                    | DynamoDB billing mode                  |
| `s3_origin_id`          | `imageCompressionS3Origin`           | CloudFront origin identifier           |
| `validation_method`     | `DNS`                                | ACM certificate validation method      |

### Frontend Environment Variables (build time)

| Variable            | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | API Gateway invoke URL (injected from Terraform output during CI/CD) |

### Lambda Environment Variables (API Lambda)

| Variable            | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `DYNAMODB_TABLE`    | DynamoDB table used for batches/jobs                                  |
| `UPLOADS_BUCKET`    | Upload bucket name used for presigned PUT URLs                        |
| `COMPRESSED_BUCKET` | Compressed bucket name used for presigned GET/zip output              |
| `PRESIGNED_URL_TTL` | Presigned URL expiration in seconds (currently set to `900`)          |
| `DDB_TTL_SECONDS`   | Optional TTL horizon for records (defaults to 7 days in handler code) |

---
