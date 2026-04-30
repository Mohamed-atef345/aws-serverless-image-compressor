data "aws_caller_identity" "current" {}

#============================== Frontend Bucket =================================#

resource "aws_s3_bucket" "frontend_bucket" {
  bucket           = format("%s-%s-%s-an", var.frontend_bucket_name, data.aws_caller_identity.current.account_id, var.aws_region)
  bucket_namespace = "account-regional"
  force_destroy    = true # to allow terraform destroy without manually empty the bucket (for easy deatruction)
}

resource "aws_s3_bucket_versioning" "frontend_bucket_versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = var.frontend_bucket_versioning_status
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_bucket_server_side_encryption_configuration" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

#============================== Uploads Bucket =================================#

resource "aws_s3_bucket" "uploads_bucket" {
  bucket           = format("%s-%s-%s-an", var.uploads_bucket_name, data.aws_caller_identity.current.account_id, var.aws_region)
  bucket_namespace = "account-regional"
  force_destroy    = true # to allow terraform destroy without manually empty the bucket (for easy deatruction)
}

resource "aws_s3_bucket_versioning" "uploads_bucket_versioning" {
  bucket = aws_s3_bucket.uploads_bucket.id
  versioning_configuration {
    status = var.uploads_bucket_versioning_status
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads_bucket_server_side_encryption_configuration" {
  bucket = aws_s3_bucket.uploads_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_accelerate_configuration" "uploads_bucket_accelerate" {
  bucket = aws_s3_bucket.uploads_bucket.id
  status = "Enabled"
}
resource "aws_s3_bucket_cors_configuration" "uploads_bucket_cors" {
  bucket = aws_s3_bucket.uploads_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    # allowed_origins = ["*"] #used for local testing
    allowed_origins = ["https://compression.myshortly.tech"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads_bucket_lifecycle" {
  bucket = aws_s3_bucket.uploads_bucket.id

  rule {
    id = "delete-after-1-day"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}

resource "aws_s3_bucket_notification" "uploads_bucket_notification" {
  bucket = aws_s3_bucket.uploads_bucket.id

  queue {
    queue_arn = var.image_uploads_queue_arn
    events    = ["s3:ObjectCreated:*"]
  }
}

#============================== Processed Bucket =================================#

resource "aws_s3_bucket" "processed_bucket" {
  bucket           = format("%s-%s-%s-an", var.processed_bucket_name, data.aws_caller_identity.current.account_id, var.aws_region)
  bucket_namespace = "account-regional"
  force_destroy    = true # to allow terraform destroy without manually empty the bucket (for easy deatruction)
}

resource "aws_s3_bucket_versioning" "processed_bucket_versioning" {
  bucket = aws_s3_bucket.processed_bucket.id
  versioning_configuration {
    status = var.processed_bucket_versioning_status
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "processed_bucket_lifecycle" {
  bucket = aws_s3_bucket.processed_bucket.id

  rule {
    id = "delete-after-7-day"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "processed_bucket_server_side_encryption_configuration" {
  bucket = aws_s3_bucket.processed_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "processed_bucket_cors" {
  bucket = aws_s3_bucket.processed_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    # allowed_origins = ["*"] #used for local testing
    allowed_origins = ["https://compression.myshortly.tech"]
    max_age_seconds = 3000
  }
}
