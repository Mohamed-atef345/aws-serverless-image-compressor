resource "aws_cloudfront_origin_access_control" "image_compression_oac" {
  name                              = "image_compression_oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "s3_and_api_distribution" {
  origin {
    domain_name              = var.frontend_bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.image_compression_oac.id
    origin_id                = var.s3_origin_id
  }

  web_acl_id = var.cloudfront_waf_acl_arn

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = ["compression.${var.domain_name}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior with precedence 0
  ordered_cache_behavior {
    path_pattern     = "/content/immutable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = var.s3_origin_id

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Cache behavior with precedence 1
  ordered_cache_behavior {
    path_pattern     = "/content/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/404.html"
    error_caching_min_ttl = 3600
  }


  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method  = "sni-only"
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_error_rate" {
  alarm_name          = "cloudfront-5xx-error-rate"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.s3_and_api_distribution.id
    Region         = "Global"
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_total_error_rate" {
  alarm_name          = "cloudfront-total-error-rate"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "TotalErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 3
  alarm_description   = "This metric monitors CloudFront total error rate"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.s3_and_api_distribution.id
    Region         = "Global"
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}
