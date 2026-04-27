variable "dashboard_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "apigw_lambda_name" {
  type = string
}

variable "worker_lambda_name" {
  type = string
}

variable "api_name" {
  type = string
}

variable "api_stage_name" {
  type = string
}

variable "sqs_queue_name" {
  type = string
}

variable "sqs_dlq_name" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "cloudfront_distribution_id" {
  type = string
}

variable "cloudfront_waf_acl_name" {
  type = string
}

variable "api_gateway_waf_acl_name" {
  type = string
}
