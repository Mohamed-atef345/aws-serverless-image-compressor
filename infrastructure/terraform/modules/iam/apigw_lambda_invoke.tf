data "aws_iam_policy_document" "apigw_lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "apigw_lambda_iam_role" {
  name               = "apigw_lambda_iam_role"
  assume_role_policy = data.aws_iam_policy_document.apigw_lambda_assume_role.json
}

#============================ IAM role least privilege policy ==========================================

data "aws_iam_policy_document" "apigw_lambda_least_privilege" {

  statement {
    sid    = "AllowGetFromUploadsPrefix"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "${var.upload_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "AllowPutToProcessedPrefix"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = [
      "${var.processed_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "AllowDynamoDBOperations"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query"
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*"
    ]
  }

  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "apigw_lambda_policy" {
  name   = "apigw_lambda_policy"
  policy = data.aws_iam_policy_document.apigw_lambda_least_privilege.json
}

resource "aws_iam_role_policy_attachment" "apigw_lambda_policy_attachment" {
  role       = aws_iam_role.apigw_lambda_iam_role.name
  policy_arn = aws_iam_policy.apigw_lambda_policy.arn
}