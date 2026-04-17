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
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.image_compression_api.id
  stage_name    = "v1"
}
