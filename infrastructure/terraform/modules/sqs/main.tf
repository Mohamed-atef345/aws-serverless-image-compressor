data "aws_caller_identity" "current" {}

#========================== SQS Queue + Policy resources =================================
data "aws_iam_policy_document" "s3_sqs_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }

    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.image_uploads_queue.arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = ["arn:aws:s3:::${var.uploads_bucket_name}-${data.aws_caller_identity.current.account_id}-${var.aws_region}-an"]
    }
  }
}

resource "aws_sqs_queue" "image_uploads_queue" {
  name                       = "image_uploads_queue"
  visibility_timeout_seconds = 900
  message_retention_seconds  = var.message_retention_seconds
}

resource "aws_sqs_queue_policy" "s3_send_message" {
  queue_url = aws_sqs_queue.image_uploads_queue.id
  policy    = data.aws_iam_policy_document.s3_sqs_policy.json
}

resource "aws_sqs_queue_redrive_policy" "image_uploads_queue_redrive_policy" {
  queue_url = aws_sqs_queue.image_uploads_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.image_uploads_deadletter_queue.arn
    maxReceiveCount     = var.maxReceiveCount
  })
}

#========================== SQS DLQ + Policy resources =================================

resource "aws_sqs_queue" "image_uploads_deadletter_queue" {
  name = "image_uploads_deadletter_queue"
}

resource "aws_sqs_queue_redrive_allow_policy" "image_uploads_deadletter_queue_redrive_allow_policy" {
  queue_url = aws_sqs_queue.image_uploads_deadletter_queue.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.image_uploads_queue.arn]
  })
}

