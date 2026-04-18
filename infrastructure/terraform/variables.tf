#================================== VPC Variables =================================#

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24", "10.0.4.0/24"]
}

variable "enable_dns_hostnames" {
  type    = bool
  default = true
}

variable "enable_dns_support" {
  type    = bool
  default = true
}

#================================== DynamoDB Variables =================================#

variable "table_name" {
  type    = string
  default = "imageCompressionMetadata"
}

variable "billing_mode" {
  type    = string
  default = "PAY_PER_REQUEST"
}

variable "hash_key" {
  type    = string
  default = "PK"
}

variable "range_key" {
  type    = string
  default = "SK"
}

variable "ttl" {
  type    = bool
  default = true
}

#==================================== S3 variables =====================================#
variable "frontend_bucket_name" {
  type    = string
  default = "image-compression-frontend-bucket"
}

variable "frontend_bucket_versioning_status" {
  type    = string
  default = "Enabled"
}

variable "uploads_bucket_name" {
  type    = string
  default = "image-compression-uploads-bucket"
}

variable "uploads_bucket_versioning_status" {
  type    = string
  default = "Disabled"
}

variable "processed_bucket_name" {
  type    = string
  default = "image-compression-processed-bucket"
}

variable "processed_bucket_versioning_status" {
  type    = string
  default = "Enabled"
}

#==================================== route 53 variables =====================================#

variable "domain_name" {
  type    = string
  default = "myshortly.tech"
}

variable "record_type" {
  type    = string
  default = "A"
}

variable "ttl_value" {
  type    = number
  default = 300
}

#========================================== ACM ============================================#

variable "validation_method" {
  type    = string
  default = "DNS"
}

#====================================== CloudFront (CDN) =======================================#

variable "s3_origin_id" {
  type    = string
  default = "imageCompressionS3Origin"
}

#================================== SQS Variables =================================#

variable "message_retention_seconds" {
  type    = number
  default = 10800
}

variable "maxReceiveCount" {
  type    = number
  default = 3
}
