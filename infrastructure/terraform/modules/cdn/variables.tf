variable "frontend_bucket_regional_domain_name" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "s3_origin_id" {
  type = string
}

variable "acm_certificate_arn" {
  type = string
}

variable "cloudfront_waf_acl_arn" {
  type = string
}

variable "ops_sns_topic_arn" {
  type = string
}
