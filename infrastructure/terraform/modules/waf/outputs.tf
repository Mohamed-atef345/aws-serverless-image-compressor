output "cloudfront_waf_acl_arn" {
  value = aws_wafv2_web_acl.cloudfront_waf_acl.arn
}

output "cloudfront_waf_acl_name" {
  value = aws_wafv2_web_acl.cloudfront_waf_acl.name
}

output "api_gateway_waf_acl_name" {
  value = aws_wafv2_web_acl.api_gateway_waf_acl.name
}
