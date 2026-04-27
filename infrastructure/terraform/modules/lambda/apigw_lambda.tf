data "archive_file" "apigw_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/../../../../codes/apigw_lambda"
  output_path = "${path.module}/apigw_lambda.zip"
}

# Lambda function
resource "aws_lambda_function" "apigw_lambda" {
  filename      = data.archive_file.apigw_lambda_code.output_path
  function_name = "apigw_lambda"
  role          = var.apigw_lambda_role_arn
  handler       = "handler.lambda_handler"
  code_sha256   = data.archive_file.apigw_lambda_code.output_base64sha256
  timeout       = 30
  runtime       = "python3.14"

  environment {
    variables = {
      DYNAMODB_TABLE       = var.dynamodb_table_name
      UPLOADS_BUCKET       = var.uploads_bucket_name
      COMPRESSED_BUCKET    = var.compressed_bucket_name
      PRESIGNED_URL_TTL    = "900"
      MAX_FILE_SIZE_BYTES  = "10485760"
      MAX_BATCH_SIZE_BYTES = "31457280"
      MAX_BATCH_FILES      = "5"
    }
  }

  tracing_config {
    mode = "Active"
  }
}


resource "aws_cloudwatch_log_group" "apigw_lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.apigw_lambda.function_name}"
  retention_in_days = 14
}


resource "aws_cloudwatch_metric_alarm" "apigw_lambda_errors" {
  alarm_name          = "apigw-lambda-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors apigw lambda errors"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.apigw_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "apigw_lambda_throttles" {
  alarm_name          = "apigw-lambda-throttles"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors apigw lambda throttles"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.apigw_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "apigw_lambda_duration_p95" {
  alarm_name          = "apigw-lambda-duration-p95"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  extended_statistic  = "p95"
  threshold           = 24000
  alarm_description   = "This metric monitors apigw lambda p95 duration"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    FunctionName = aws_lambda_function.apigw_lambda.function_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

