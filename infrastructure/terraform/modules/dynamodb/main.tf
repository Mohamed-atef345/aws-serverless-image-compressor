resource "aws_dynamodb_table" "image_compression_metadata" {
  name         = var.table_name
  billing_mode = var.billing_mode
  hash_key     = var.hash_key
  range_key    = var.range_key

  attribute {
    name = var.hash_key
    type = "S"
  }

  attribute {
    name = var.range_key
    type = "S"
  }

  attribute {
    name = "batch_id"
    type = "S"
  }

  global_secondary_index {
    name            = "batch_id-index"
    hash_key        = "batch_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = var.ttl
  }

  tags = {
    Name = var.table_name
  }
}
