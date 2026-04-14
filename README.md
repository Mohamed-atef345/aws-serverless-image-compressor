<p align="center">
  <img src="https://img.shields.io/badge/AWS-Serverless-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS Serverless"/>
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" alt="Terraform"/>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12"/>
</p>

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
│                                  FRONTEND                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │   React     │───▶│  CloudFront  │───▶│         S3 (Static)             │ │
│  │   (Vite)    │    │     CDN      │    │      apps/web/dist              │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 API LAYER                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │     WAF     │───▶│ API Gateway  │───▶│        Lambda (API)             │ │
│  │             │    │   REST API   │    │   services/api/handler.py       │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING LAYER                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐ │
│  │ S3 (Upload) │───▶│     SQS      │───▶│      Lambda (Worker)            │ │
│  │   Event     │    │    Queue     │    │  services/worker/handler.py     │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────────────┘ │
│                            │                           │                   │
│                            ▼                           ▼                   │
│                     ┌──────────────┐         ┌─────────────────────────────┐│
│                     │     DLQ      │         │    S3 (Compressed)          ││
│                     │ Dead Letter  │         │    Output Bucket            ││
│                     └──────────────┘         └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          DynamoDB                                      ││
│  │                   Jobs / Batches Table                                  ││
│  │   PK | SK | jobId | status | original_key | compressed_key | TTL       ││
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
| **API Lambda**    | Python 3.12, boto3, aws_lambda_powertools, Pydantic |
| **Worker Lambda** | Python 3.12, Pillow (Lambda Layer), boto3           |
| **Queue**         | SQS (Standard) + Dead Letter Queue                 |
| **Database**      | DynamoDB (PAY_PER_REQUEST, single-table design)     |
| **Storage**       | S3 — 3 buckets (frontend, uploads, compressed)      |
| **IaC**           | Terraform 1.x (AWS Provider 6.39, remote S3 state) |
| **CI/CD**         | GitHub Actions (OIDC auth, no stored secrets)       |
| **Security**      | WAF, OAC, SSE-AES256, least-privilege IAM           |
| **Observability** | X-Ray tracing, CloudWatch structured JSON logging   |
| **Docs**          | OpenAPI / Swagger                                   |

---

## 📁 Project Structure

```
image_compressor/
├── apps/
│   └── web/                          # React frontend (Vite + TypeScript)
│       ├── src/
│       │   ├── api/                   # API client, types, endpoints
│       │   │   └── index.ts           # API_BASE_URL, request helpers, S3 upload
│       │   ├── components/            # React components
│       │   │   ├── Badge.tsx          # Feature badge component
│       │   │   ├── CustomDropdown.tsx  # Shared dropdown with context
│       │   │   ├── HeroSection.tsx     # Hero + Upload area
│       │   │   ├── Icons.tsx          # SVG icon components
│       │   │   ├── Navigation.tsx     # Top navigation bar
│       │   │   ├── StaticBackground.tsx # Background gradient/effects
│       │   │   ├── UploadInput.tsx    # Drag & drop upload with previews
│       │   │   └── index.ts          # Barrel exports
│       │   ├── App.tsx               # Root component
│       │   ├── main.tsx              # React entry point
│       │   └── index.css             # Global styles + animations
│       ├── public/
│       │   └── favicon.svg
│       ├── index.html                # Entry HTML with Google Fonts
│       ├── package.json              # React 19, Vite 6, TailwindCSS
│       ├── tailwind.config.js        # Custom fonts, colors, spacing
│       ├── vite.config.ts            # Dev server port 3000, sourcemaps
│       └── tsconfig.json
│
├── services/                          # ⚠️ NOT YET CREATED
│   ├── api/                          # Python API Lambda handlers
│   └── worker/                       # Python image compression Lambda
│
├── packages/                          # ⚠️ NOT YET CREATED
│   └── shared/                       # Shared types, schemas, utilities
│
├── infrastructure/
│   └── terraform/
│       ├── main.tf                   # Module composition (root)
│       ├── backend.tf                # S3 remote state + AWS provider
│       ├── variables.tf              # All input variables with defaults
│       ├── outputs.tf                # Bucket names, CloudFront, ACM ARNs
│       └── modules/
│           ├── S3_buckets/           # 3 buckets: frontend, uploads, processed
│           ├── cdn/                  # CloudFront distribution + OAC
│           ├── acm/                  # ACM certificate + DNS validation
│           ├── route 53/             # DNS alias record for subdomain
│           ├── iam/                  # CloudFront → S3 bucket policy
│           ├── dynamodb/             # Jobs table (PK/SK, GSI, TTL)
│           ├── vpc/                  # VPC, subnets, NAT, IGW, route tables
│           ├── api gateway/          # REST API, all endpoints, deployment
│           ├── sqs/                  # (empty — not yet implemented)
│           ├── lambda/               # (empty — not yet implemented)
│           └── storage/              # (empty — not yet implemented)
│
├── tests/                             # ⚠️ NOT YET CREATED
│   ├── unit/                         # pytest + moto
│   └── integration/                  # Cross-service integration tests
│
├── .github/                           # ⚠️ NOT YET CREATED
│   └── workflows/                    # GitHub Actions CI/CD pipelines
│
├── docs/
│   └── infrastructure-guide.md       # Comprehensive infra & integration guide
│
├── AGENTS.md                         # Project conventions & architecture spec
├── .gitignore                        # Terraform, node_modules, env, build
└── README.md                         # ← You are here
```

---

## 🧱 Infrastructure Modules

The infrastructure is organized into reusable Terraform modules. Below is the status and description of each module:

### ✅ Deployed & Fully Implemented

| Module | Description | Key Resources |
|--------|-------------|---------------|
| **S3_buckets** | Three S3 buckets with SSE-AES256 encryption and configurable versioning | `frontend-bucket`, `uploads-bucket`, `processed-bucket` |
| **cdn** | CloudFront distribution with Origin Access Control (OAC), HTTPS redirect, custom error pages (404 → 200), and PriceClass_200 | CloudFront distribution with cache behaviors for immutable and dynamic content |
| **acm** | ACM SSL certificate for `myshortly.tech` with wildcard SAN (`*.myshortly.tech`), DNS validation via Route 53 | Certificate + validation records |
| **route 53** | DNS alias record pointing `compression.myshortly.tech` to the CloudFront distribution | Route 53 A-record alias |
| **iam** | S3 bucket policy allowing CloudFront service principal to `s3:GetObject` on the frontend bucket (OAC-based) | Bucket policy document |
| **dynamodb** | DynamoDB table (`imageCompressionMetadata`) in PAY_PER_REQUEST mode with composite key (PK/SK), GSI on `jobId`, and TTL on `expiresAt` | Table + Global Secondary Index |
| **vpc** | Full VPC with 2 public + 2 private subnets across 2 AZs, NAT Gateway (regional), Internet Gateway, and route tables | VPC, subnets, NAT, IGW, route tables |
| **api gateway** | REST API (`image_compression_api`) with all 5 endpoints, Lambda proxy integrations, deployment, and `v1` stage | API resources, methods, integrations, stage |

### ⚠️ Module Created but Empty

| Module | Description | Status |
|--------|-------------|--------|
| **sqs** | SQS queue + DLQ for async job processing | Directory exists, no `.tf` files |
| **lambda** | Lambda functions for API and Worker | Directory exists, no `.tf` files |
| **storage** | Additional storage configuration (lifecycle rules, CORS, etc.) | Directory exists, no `.tf` files |

### ℹ️ Root Module Notes

- The **VPC** and **DynamoDB** modules are fully implemented but are currently **commented out** in `main.tf` (not deployed yet)
- The **API Gateway** module is fully implemented but is **not yet wired** in `main.tf`
- Active modules in root `main.tf`: `s3_buckets`, `cdn`, `route53`, `acm`, `iam`
- Backend state stored in S3 bucket `terraform-backend-bucket-017777088168-us-east-1-an`
- AWS Provider version locked to `6.39.0`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-url` | Create batch + jobs, return presigned S3 upload URLs |
| `GET` | `/jobs/{jobId}` | Get individual job status |
| `GET` | `/jobs/{jobId}/download` | Get presigned download URL for a compressed image |
| `GET` | `/batches/{batchId}` | Get aggregated batch status |
| `GET` | `/batches/{batchId}/download` | Get download link (single file or zip archive) |

> **Note:** All endpoints are configured as `AWS_PROXY` Lambda integrations in the API Gateway module. Authorization is currently set to `NONE` (authentication is planned for a future phase).

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
  - Image preview grid (5 columns)
  - Per-file size badges with remove button on hover
  - "Add more" button (up to 10 images, max 20MB each)
  - Summary row showing image count + total size
  - "Start Compression" button
- **Compression settings** dropdowns:
  - Compression level: Low / Medium / High
  - Output format: Keep Original / WebP / JPEG / PNG
- **API client** (`src/api/index.ts`) with:
  - Full TypeScript types for all request/response payloads
  - `apiRequest<T>()` generic helper
  - `uploadToS3()` with XHR progress tracking
  - `VITE_API_BASE_URL` environment variable integration
- **Static gradient background** with glassmorphism card effects
- **Custom Google Fonts**: Schibsted Grotesk, Inter, Noto Sans, Fustat
- Custom scrollbar styling, animations (fade-in, dropdown), and focus-visible outlines

### Not Yet Implemented (Frontend)
- Actual API integration (compress button logs to console, no backend calls)
- Job status polling UI / progress indicators
- Download results page
- Authentication UI (Sign Up / Log In are non-functional)
- Responsive / mobile layout
- Error handling UI
- 404 page

---

## 🔧 DevOps & CI/CD

### Planned CI/CD Pipeline

| Stage | Trigger | Steps |
|-------|---------|-------|
| **PR Checks** | Pull Request | Lint → pytest → Trivy scan → tfsec scan → Infracost → terraform plan |
| **Deploy** | Push to `main` | OIDC auth → terraform apply → build frontend → S3 sync → CloudFront invalidation → deploy Lambdas |

### Planned DevOps Tooling

| Tool | Purpose | Status |
|------|---------|--------|
| **OIDC** | GitHub Actions → AWS auth (no stored secrets) | 🔴 Not started |
| **Trivy** | Docker image CVE scanning in CI | 🔴 Not started |
| **tfsec** | Terraform security misconfiguration scanning | 🔴 Not started |
| **Infracost** | Cost estimate comments on PRs | 🔴 Not started |
| **pre-commit** | black, ruff, terraform fmt/validate | 🔴 Not started |
| **ECR Scanning** | CVE scanning for pushed Docker images | 🔴 Not started |
| **Makefile** | One-command deploy, destroy, test, lint | 🔴 Not started |

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
- 🔲 CORS configuration (currently `*` origins — needs restriction for production)
- 🔲 Cognito / API Key authentication

---

## 📊 Project Status

### ✅ What's Done

| Component | Details |
|-----------|---------|
| **Project Architecture** | Full architecture designed and documented in `AGENTS.md` |
| **Infrastructure Guide** | Comprehensive 1500-line guide covering all AWS services, Terraform configs, CI/CD, and environment variables (`docs/infrastructure-guide.md`) |
| **S3 Buckets Module** | 3 buckets (frontend, uploads, processed) with SSE, versioning, account-regional naming — **deployed** |
| **CloudFront CDN Module** | Distribution with OAC, HTTPS redirect, custom 404, cache behaviors, PriceClass_200 — **deployed** |
| **ACM Module** | SSL certificate for `myshortly.tech` + `*.myshortly.tech` with Route 53 DNS validation — **deployed** |
| **Route 53 Module** | A-record alias `compression.myshortly.tech` → CloudFront — **deployed** |
| **IAM Module** | CloudFront → S3 bucket policy for frontend access — **deployed** |
| **Terraform Remote State** | S3 backend with native lockfile support, AWS Provider 6.39.0 |
| **DynamoDB Module** | Table with PK/SK composite key, `jobId` GSI, TTL — **code complete** (commented out in root) |
| **VPC Module** | Full VPC: 2 AZs, 2 public + 2 private subnets, NAT Gateway, IGW, route tables — **code complete** (commented out in root) |
| **API Gateway Module** | REST API with all 5 endpoints (upload-url, jobs, job download, batches, batch download), Lambda proxy integrations, deployment + stage — **code complete** (not wired in root) |
| **Frontend Landing Page** | React 19 app with Navigation, Hero section, Upload component (drag & drop, previews, settings), API client types |
| **Frontend API Client** | Full TypeScript types, endpoint definitions, generic request helper, S3 upload with progress |
| **`.gitignore`** | Properly configured for Terraform, Node.js, env files, build artifacts |

### 🛠️ In Progress

| Component | Details | What Remains |
|-----------|---------|--------------|
| **Root Terraform Wiring** | VPC, DynamoDB, and API Gateway modules exist but need to be uncommented/added in `main.tf` | Wire modules, add missing variable pass-through, resolve references |
| **SQS Module** | Directory created at `modules/sqs/` | Write `main.tf` for compression queue + DLQ + S3 event notification + SQS policy |
| **Lambda Module** | Directory created at `modules/lambda/` | Write `main.tf` for API Lambda + Worker Lambda + SQS event source mapping + CloudWatch log groups |
| **Storage Module** | Directory created at `modules/storage/` | Lifecycle rules (1-day upload expiry, 7-day compressed expiry), CORS config for uploads bucket |

### 🔴 Not Started

| Component | Description |
|-----------|-------------|
| **API Lambda Handler** (`services/api/`) | Python 3.12 handler: presigned URL generation, DynamoDB batch/job creation, job status queries, download URL generation |
| **Worker Lambda Handler** (`services/worker/`) | Python 3.12 handler: image decompression with Pillow, format conversion, DynamoDB status updates, S3 read/write |
| **Shared Packages** (`packages/shared/`) | Pydantic v2 models, shared schemas, custom exceptions, constants |
| **Unit Tests** (`tests/unit/`) | pytest + moto for API and Worker Lambda handlers |
| **Integration Tests** (`tests/integration/`) | Cross-service tests (API → SQS → Worker → S3 → DynamoDB) |
| **GitHub Actions CI/CD** (`.github/workflows/`) | OIDC auth, terraform plan/apply, frontend build → S3 sync, Lambda deployment |
| **Makefile** | One-command `deploy`, `destroy`, `test`, `lint`, `fmt` |
| **pre-commit Config** | black, ruff, terraform fmt/validate hooks |
| **OpenAPI Spec** (`docs/`) | Swagger/OpenAPI documentation for all API endpoints |
| **Frontend → API Integration** | Wire `handleCompress()` to actual API calls, implement job polling, download flow |
| **Frontend Auth UI** | Sign Up / Log In flows (Cognito integration) |
| **Frontend Results UI** | Compression progress, before/after comparison, download page |
| **Frontend Responsive Design** | Mobile and tablet layouts |
| **Frontend Error Handling** | Error boundaries, toast notifications, retry logic |
| **WAF Configuration** | Web Application Firewall rules for API Gateway |
| **API Gateway Throttling** | Usage plans, method-level rate limits |
| **CloudWatch Dashboards** | Operational dashboards for Lambda, SQS, API Gateway metrics |
| **Monitoring & Alerting** | CloudWatch Alarms, SNS notifications for DLQ messages, Lambda errors |

---

## 🚀 Getting Started

### Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) ≥ 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Node.js](https://nodejs.org/) ≥ 18 (or [Bun](https://bun.sh/))
- [Python](https://www.python.org/) 3.12
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

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region |
| `domain_name` | `myshortly.tech` | Root domain for the project |
| `frontend_bucket_name` | `image-compression-frontend-bucket` | Frontend S3 bucket name prefix |
| `uploads_bucket_name` | `image-compression-uploads-bucket` | Uploads S3 bucket name prefix |
| `processed_bucket_name` | `image-compression-processed-bucket` | Processed images S3 bucket name prefix |
| `table_name` | `imageCompressionMetadata` | DynamoDB table name |
| `billing_mode` | `PAY_PER_REQUEST` | DynamoDB billing mode |
| `s3_origin_id` | `imageCompressionS3Origin` | CloudFront origin identifier |
| `validation_method` | `DNS` | ACM certificate validation method |

### Frontend Environment Variables (build time)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API Gateway invoke URL (injected from Terraform output during CI/CD) |

### Lambda Environment Variables (set by Terraform — planned)

| Variable | Lambda | Description |
|----------|--------|-------------|
| `ENVIRONMENT` | Both | Environment name (dev/staging/prod) |
| `UPLOAD_BUCKET` | Both | S3 bucket name for uploads |
| `COMPRESSED_BUCKET` | Both | S3 bucket name for compressed images |
| `DYNAMODB_TABLE` | Both | DynamoDB table name |
| `SQS_QUEUE_URL` | API | SQS queue URL |
| `PRESIGNED_URL_EXPIRATION` | API | Presigned URL TTL (seconds) |
| `MAX_FILE_SIZE_MB` | API | Max upload file size |
| `POWERTOOLS_SERVICE_NAME` | Both | AWS Lambda Powertools service name |
| `POWERTOOLS_LOG_LEVEL` | Both | Log level (DEBUG in dev, INFO in prod) |

---

## 📄 License

This project is for portfolio and educational purposes.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Mohamed-atef345">Mohamed Atef</a></sub>
</p>
