variable "table_name" {
  type = string
}

variable "billing_mode" {
  type = string
}

variable "hash_key" {
  type = string
}

variable "range_key" {
  type = string
}

variable "ttl" {
  type = bool
}

variable "ops_sns_topic_arn" {
  type = string
}
