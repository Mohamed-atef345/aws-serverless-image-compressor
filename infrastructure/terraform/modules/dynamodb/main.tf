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

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "dynamodb-throttled-requests"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors DynamoDB throttled requests"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    TableName = aws_dynamodb_table.image_compression_metadata.name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  alarm_name          = "dynamodb-system-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors DynamoDB system errors"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    TableName = aws_dynamodb_table.image_compression_metadata.name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}
