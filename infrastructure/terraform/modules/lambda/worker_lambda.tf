resource "aws_lambda_event_source_mapping" "worker_lambda_event_source_mapping" {
  event_source_arn                   = var.image_uploads_queue_arn
  function_name                      = aws_lambda_function.worker_lambda.arn
  batch_size                         = 5
  maximum_batching_window_in_seconds = 2
  function_response_types            = ["ReportBatchItemFailures"]
  enabled                            = true
}

data "archive_file" "worker_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/../../../../codes/worker_lambda"
  output_path = "${path.module}/worker_lambda.zip"
}

resource "aws_lambda_function" "worker_lambda" {
  filename      = data.archive_file.worker_lambda_code.output_path
  function_name = "worker_lambda"
  role          = var.worker_lambda_role_arn
  handler       = "handler.lambda_handler"
  code_sha256   = data.archive_file.worker_lambda_code.output_base64sha256
  layers        = [aws_lambda_layer_version.pillow_layer.arn]
  timeout       = 120
  runtime       = "python3.14"
  memory_size   = 512

  environment {
    variables = {
      DYNAMODB_TABLE        = var.dynamodb_table_name
      COMPRESSED_BUCKET     = var.compressed_bucket_name
      DEFAULT_OUTPUT_FORMAT = "WEBP"
      DEFAULT_QUALITY       = "80"
    }
  }

  tracing_config {
    mode = "Active"
  }
}

resource "aws_cloudwatch_log_group" "worker_lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.worker_lambda.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_metric_alarm" "worker_lambda_errors" {
  alarm_name          = "worker-lambda-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors worker lambda errors"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.worker_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "worker_lambda_throttles" {
  alarm_name          = "worker-lambda-throttles"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors worker lambda throttles"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.worker_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "worker_lambda_duration_p95" {
  alarm_name          = "worker-lambda-duration-p95"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  extended_statistic  = "p95"
  threshold           = 96000
  alarm_description   = "This metric monitors worker lambda p95 duration"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.worker_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_lambda_layer_version" "pillow_layer" {
  filename                 = "${path.module}/pillow_layer.zip"
  layer_name               = "pillow_layer"
  source_code_hash         = filebase64sha256("${path.module}/pillow_layer.zip")
  compatible_architectures = ["x86_64"]
  compatible_runtimes      = ["python3.14"]
}
