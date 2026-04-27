resource "aws_wafv2_web_acl" "cloudfront_waf_acl" {
  name        = "cloudfront-rate-based-acl"
  scope       = "CLOUDFRONT" #region must be us-east-1 for cloudfront
  description = "Rate-based WAF for CloudFront"


  default_action {
    allow {}
  }

  rule {
    name     = "aws-common-rule-set"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "cloudfront-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-known-bad-inputs-rule-set"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "cloudfront-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-ip-reputation-rule-set"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "cloudfront-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "rate-limit-per-ip"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit                 = 300
        evaluation_window_sec = 60
        aggregate_key_type    = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "cloudfront-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "cloudfront-waf-acl"
    sampled_requests_enabled   = true
  }
}


resource "aws_wafv2_web_acl" "api_gateway_waf_acl" {
  name        = "api-gateway-rate-based-acl"
  scope       = "REGIONAL"
  description = "Rate-based WAF for API Gateway"

  default_action {
    allow {}
  }

  rule {
    name     = "aws-common-rule-set"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apigw-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-known-bad-inputs-rule-set"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apigw-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-ip-reputation-rule-set"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apigw-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "rate-limit-per-ip"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit                 = 300
        evaluation_window_sec = 60
        aggregate_key_type    = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "apigw-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "apigw-waf-acl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "apigateway_association" {
  resource_arn = var.api_gateway_stage_arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway_waf_acl.arn
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_waf_blocked_requests" {
  alarm_name          = "cloudfront-waf-blocked-requests"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "This metric monitors blocked requests on CloudFront WAF"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.cloudfront_waf_acl.name
    Region = "Global"
    Rule   = "ALL"
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_waf_blocked_requests" {
  alarm_name          = "apigateway-waf-blocked-requests"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "This metric monitors blocked requests on API Gateway WAF"
  alarm_actions       = [var.ops_sns_topic_arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.api_gateway_waf_acl.name
    Region = "us-east-1"
    Rule   = "ALL"
  }

  treat_missing_data        = "notBreaching"
  insufficient_data_actions = []
}
