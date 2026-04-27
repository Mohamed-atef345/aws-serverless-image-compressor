variable "message_retention_seconds" {
  type = number
}

variable "maxReceiveCount" {
  type = number
}

variable "uploads_bucket_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "ops_sns_topic_arn" {
  type = string
}
