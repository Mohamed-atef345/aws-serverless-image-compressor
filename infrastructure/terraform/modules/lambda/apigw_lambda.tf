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
      DYNAMODB_TABLE    = var.dynamodb_table_name
      UPLOADS_BUCKET    = var.uploads_bucket_name
      COMPRESSED_BUCKET = var.compressed_bucket_name
      PRESIGNED_URL_TTL = "900"
      MAX_FILE_SIZE_BYTES  = "10485760"
      MAX_BATCH_SIZE_BYTES = "31457280"
    }
  }
}
