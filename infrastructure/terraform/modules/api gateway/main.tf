resource "aws_api_gateway_rest_api" "image_compression_api" {
  name        = "image_compression_api"
  description = "API for the serverless image compression platform"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

#===================================== POST /upload-url =====================================#

resource "aws_api_gateway_resource" "upload_url" {
  parent_id   = aws_api_gateway_rest_api.image_compression_api.root_resource_id
  path_part   = "upload-url"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_method" "upload_url_method" {
  authorization = "NONE"
  http_method   = "POST"
  resource_id   = aws_api_gateway_resource.upload_url.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_method" "upload_url_options_method" {
  authorization = "NONE"
  http_method   = "OPTIONS"
  resource_id   = aws_api_gateway_resource.upload_url.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_integration" "upload_url_integration" {
  http_method             = aws_api_gateway_method.upload_url_method.http_method
  resource_id             = aws_api_gateway_resource.upload_url.id
  rest_api_id             = aws_api_gateway_rest_api.image_compression_api.id
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.apigw_lambda_invoke_arn
}

resource "aws_api_gateway_integration" "upload_url_options_integration" {
  http_method = aws_api_gateway_method.upload_url_options_method.http_method
  resource_id = aws_api_gateway_resource.upload_url.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "upload_url_options_method_response_200" {
  http_method = aws_api_gateway_method.upload_url_options_method.http_method
  resource_id = aws_api_gateway_resource.upload_url.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "upload_url_options_integration_response_200" {
  http_method = aws_api_gateway_method.upload_url_options_method.http_method
  resource_id = aws_api_gateway_resource.upload_url.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = aws_api_gateway_method_response.upload_url_options_method_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.upload_url_options_integration]
}

#===================================== GET /jobs/{jobId} =====================================#

resource "aws_api_gateway_resource" "job_data_base" {
  parent_id   = aws_api_gateway_rest_api.image_compression_api.root_resource_id
  path_part   = "jobs"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_resource" "job_data" {
  parent_id   = aws_api_gateway_resource.job_data_base.id
  path_part   = "{jobId}"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_method" "job_data_method" {
  authorization = "NONE"
  http_method   = "GET"
  resource_id   = aws_api_gateway_resource.job_data.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
  request_parameters = {
    "method.request.path.jobId" = true
  }
}

resource "aws_api_gateway_method" "job_data_options_method" {
  authorization = "NONE"
  http_method   = "OPTIONS"
  resource_id   = aws_api_gateway_resource.job_data.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_integration" "job_data_integration" {
  http_method             = aws_api_gateway_method.job_data_method.http_method
  resource_id             = aws_api_gateway_resource.job_data.id
  rest_api_id             = aws_api_gateway_rest_api.image_compression_api.id
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.apigw_lambda_invoke_arn
}

resource "aws_api_gateway_integration" "job_data_options_integration" {
  http_method = aws_api_gateway_method.job_data_options_method.http_method
  resource_id = aws_api_gateway_resource.job_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "job_data_options_method_response_200" {
  http_method = aws_api_gateway_method.job_data_options_method.http_method
  resource_id = aws_api_gateway_resource.job_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "job_data_options_integration_response_200" {
  http_method = aws_api_gateway_method.job_data_options_method.http_method
  resource_id = aws_api_gateway_resource.job_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = aws_api_gateway_method_response.job_data_options_method_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.job_data_options_integration]
}

#===================================== GET /batches/{batchId} =====================================#

resource "aws_api_gateway_resource" "batch_data_base" {
  parent_id   = aws_api_gateway_rest_api.image_compression_api.root_resource_id
  path_part   = "batches"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_resource" "batch_data" {
  parent_id   = aws_api_gateway_resource.batch_data_base.id
  path_part   = "{batchId}"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_method" "batch_data_method" {
  authorization = "NONE"
  http_method   = "GET"
  resource_id   = aws_api_gateway_resource.batch_data.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
  request_parameters = {
    "method.request.path.batchId" = true
  }
}

resource "aws_api_gateway_method" "batch_data_options_method" {
  authorization = "NONE"
  http_method   = "OPTIONS"
  resource_id   = aws_api_gateway_resource.batch_data.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_integration" "batch_data_integration" {
  http_method             = aws_api_gateway_method.batch_data_method.http_method
  resource_id             = aws_api_gateway_resource.batch_data.id
  rest_api_id             = aws_api_gateway_rest_api.image_compression_api.id
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.apigw_lambda_invoke_arn
}

resource "aws_api_gateway_integration" "batch_data_options_integration" {
  http_method = aws_api_gateway_method.batch_data_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "batch_data_options_method_response_200" {
  http_method = aws_api_gateway_method.batch_data_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "batch_data_options_integration_response_200" {
  http_method = aws_api_gateway_method.batch_data_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_data.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = aws_api_gateway_method_response.batch_data_options_method_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.batch_data_options_integration]
}

#===================================== GET /batches/{batchId}/download =====================================#

resource "aws_api_gateway_resource" "batch_zip_download" {
  parent_id   = aws_api_gateway_resource.batch_data.id
  path_part   = "download"
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_method" "batch_zip_download_method" {
  authorization = "NONE"
  http_method   = "GET"
  resource_id   = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
  request_parameters = {
    "method.request.path.batchId" = true
  }
}

resource "aws_api_gateway_method" "batch_zip_download_options_method" {
  authorization = "NONE"
  http_method   = "OPTIONS"
  resource_id   = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
}

resource "aws_api_gateway_integration" "batch_zip_download_integration" {
  http_method             = aws_api_gateway_method.batch_zip_download_method.http_method
  resource_id             = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id             = aws_api_gateway_rest_api.image_compression_api.id
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.apigw_lambda_invoke_arn
}

resource "aws_api_gateway_integration" "batch_zip_download_options_integration" {
  http_method = aws_api_gateway_method.batch_zip_download_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "batch_zip_download_options_method_response_200" {
  http_method = aws_api_gateway_method.batch_zip_download_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "batch_zip_download_options_integration_response_200" {
  http_method = aws_api_gateway_method.batch_zip_download_options_method.http_method
  resource_id = aws_api_gateway_resource.batch_zip_download.id
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  status_code = aws_api_gateway_method_response.batch_zip_download_options_method_response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.batch_zip_download_options_integration]
}

#===================================== Deployment & Stage =====================================#

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.upload_url.id,
      aws_api_gateway_resource.job_data_base.id,
      aws_api_gateway_resource.job_data.id,
      aws_api_gateway_resource.batch_data_base.id,
      aws_api_gateway_resource.batch_data.id,
      aws_api_gateway_resource.batch_zip_download.id,
      aws_api_gateway_method.upload_url_method.id,
      aws_api_gateway_method.upload_url_options_method.id,
      aws_api_gateway_method.job_data_method.id,
      aws_api_gateway_method.job_data_options_method.id,
      aws_api_gateway_method.batch_data_method.id,
      aws_api_gateway_method.batch_data_options_method.id,
      aws_api_gateway_method.batch_zip_download_method.id,
      aws_api_gateway_method.batch_zip_download_options_method.id,
      aws_api_gateway_integration.upload_url_integration.id,
      aws_api_gateway_integration.upload_url_options_integration.id,
      aws_api_gateway_integration_response.upload_url_options_integration_response_200.id,
      aws_api_gateway_integration.job_data_integration.id,
      aws_api_gateway_integration.job_data_options_integration.id,
      aws_api_gateway_integration_response.job_data_options_integration_response_200.id,
      aws_api_gateway_integration.batch_data_integration.id,
      aws_api_gateway_integration.batch_data_options_integration.id,
      aws_api_gateway_integration_response.batch_data_options_integration_response_200.id,
      aws_api_gateway_integration.batch_zip_download_integration.id,
      aws_api_gateway_integration.batch_zip_download_options_integration.id,
      aws_api_gateway_integration_response.batch_zip_download_options_integration_response_200.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.upload_url_integration,
    aws_api_gateway_integration_response.upload_url_options_integration_response_200,
    aws_api_gateway_integration.job_data_integration,
    aws_api_gateway_integration_response.job_data_options_integration_response_200,
    aws_api_gateway_integration.batch_data_integration,
    aws_api_gateway_integration_response.batch_data_options_integration_response_200,
    aws_api_gateway_integration.batch_zip_download_integration,
    aws_api_gateway_integration_response.batch_zip_download_options_integration_response_200,
  ]
}

resource "aws_api_gateway_stage" "main" {
  deployment_id        = aws_api_gateway_deployment.main.id
  rest_api_id          = aws_api_gateway_rest_api.image_compression_api.id
  stage_name           = "v1"
  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_access_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  depends_on = [aws_api_gateway_account.main]
}

resource "aws_cloudwatch_log_group" "api_gateway_access_logs" {
  name              = "/aws/apigateway/image-compression-api-v1-access"
  retention_in_days = 14
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.image_compression_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "ERROR"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "api-gateway-5xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.image_compression_api.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  alarm_name          = "api-gateway-4xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 20
  alarm_description   = "This metric monitors sustained API Gateway 4XX errors"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.image_compression_api.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency_p95" {
  alarm_name          = "api-gateway-latency-p95"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 5000
  alarm_description   = "This metric monitors API Gateway p95 latency"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.image_compression_api.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_integration_latency_p95" {
  alarm_name          = "api-gateway-integration-latency-p95"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 4000
  alarm_description   = "This metric monitors API Gateway integration p95 latency"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.image_compression_api.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_role_policy" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}
