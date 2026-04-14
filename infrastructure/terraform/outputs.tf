/*output "vpc_id" {
    value = module.vpc.vpc_id
}

output "private_subnet_ids" {
    value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
    value = module.vpc.public_subnet_ids
}

output "nat_gateway_id" {
    value = module.vpc.nat_gateway_id
}
*/

output "frontend_bucket_name" {
  value = module.s3_buckets.frontend_bucket_name
}

output "frontend_bucket_arn" {
  value = module.s3_buckets.frontend_bucket_arn
}

output "uploads_bucket_name" {
  value = module.s3_buckets.uploads_bucket_name
}

output "processed_bucket_name" {
  value = module.s3_buckets.processed_bucket_name
}

output "cloudfront_distribution_arn" {
  value = module.cdn.cloudfront_distribution_arn
}

output "cloudfront_distribution_domain_name" {
  value = module.cdn.cloudfront_distribution_domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  value = module.cdn.cloudfront_distribution_hosted_zone_id
}

output "acm_certificate_arn" {
  value = module.acm.acm_certificate_arn
}

