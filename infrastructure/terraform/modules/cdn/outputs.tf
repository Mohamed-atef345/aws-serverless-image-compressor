output "cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.s3_and_api_distribution.arn
}

output "cloudfront_distribution_domain_name" {
  value = aws_cloudfront_distribution.s3_and_api_distribution.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  value = aws_cloudfront_distribution.s3_and_api_distribution.hosted_zone_id
}