variable "aws_region" {
  type        = string
  description = "AWS region for bucket naming"
}

variable "frontend_bucket_name" {
  type = string
}

variable "frontend_bucket_versioning_status" {
  type = string
}

variable "uploads_bucket_name" {
  type = string
}

variable "uploads_bucket_versioning_status" {
  type = string
}

variable "processed_bucket_name" {
  type = string
}

variable "processed_bucket_versioning_status" {
  type = string
}

variable "image_uploads_queue_arn" {
  type = string
}
