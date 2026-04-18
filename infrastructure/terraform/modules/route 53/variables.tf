variable "domain_name" {
  type = string
}

variable "cloudfront_distribution_domain_name" {
  type = string
}

variable "record_type" {
  type = string
}

variable "ttl_value" {
  type = number
}

variable "cloudfront_distribution_hosted_zone_id" {
  type = string
}