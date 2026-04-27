variable "apigw_lambda_role_arn" {
  type = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "uploads_bucket_name" {
  type = string
}

variable "compressed_bucket_name" {
  type = string
}

variable "worker_lambda_role_arn" {
  type = string
}

variable "image_uploads_queue_arn" {
  type = string
}

variable "ops_sns_topic_arn" {
  type = string
}