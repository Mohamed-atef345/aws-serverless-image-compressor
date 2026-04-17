resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.apigw_lambda.apigw_lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${module.api_gateway.api_execution_arn}/*/*"
}

/* module "vpc" {
  source  = "./modules/vpc"

  availability_zones = var.availability_zones
  vpc_cidr = var.vpc_cidr
  subnet_cidrs = var.subnet_cidrs
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support = var.enable_dns_support
}
*/
module "dynamodb" {
    source = "./modules/dynamodb"

    table_name = var.table_name
    billing_mode = var.billing_mode
    hash_key = var.hash_key
    range_key = var.range_key
    ttl = var.ttl
}


module "s3_buckets" {
  source = "./modules/S3_buckets"

  aws_region                         = var.aws_region
  frontend_bucket_name               = var.frontend_bucket_name
  frontend_bucket_versioning_status  = var.frontend_bucket_versioning_status
  uploads_bucket_name                = var.uploads_bucket_name
  uploads_bucket_versioning_status   = var.uploads_bucket_versioning_status
  processed_bucket_name              = var.processed_bucket_name
  processed_bucket_versioning_status = var.processed_bucket_versioning_status
}

module "cdn" {
  source = "./modules/cdn"

  frontend_bucket_regional_domain_name = module.s3_buckets.frontend_bucket_regional_domain_name
  domain_name                          = var.domain_name
  s3_origin_id                         = var.s3_origin_id
  acm_certificate_arn                  = module.acm.acm_certificate_arn
}

module "route53" {
  source = "./modules/route 53"

  domain_name                            = var.domain_name
  cloudfront_distribution_domain_name    = module.cdn.cloudfront_distribution_domain_name
  cloudfront_distribution_hosted_zone_id = module.cdn.cloudfront_distribution_hosted_zone_id
  record_type                            = var.record_type
  ttl_value                              = var.ttl_value
}

module "acm" {
  source = "./modules/acm"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name       = var.domain_name
  validation_method = var.validation_method
}

module "iam" {
  source = "./modules/iam"

  cloudfront_distribution_arn = module.cdn.cloudfront_distribution_arn
  frontend_bucket_arn         = module.s3_buckets.frontend_bucket_arn
  frontend_bucket_id          = module.s3_buckets.frontend_bucket_id
  upload_bucket_arn           = module.s3_buckets.upload_bucket_arn
  processed_bucket_arn        = module.s3_buckets.processed_bucket_arn
  dynamodb_table_arn          = module.dynamodb.dynamodb_table_arn

}

module "api_gateway" {
  source = "./modules/api gateway"

  apigw_lambda_invoke_arn = module.apigw_lambda.apigw_lambda_invoke_arn
}

module "apigw_lambda" {
  source = "./modules/lambda"

  apigw_lambda_role_arn = module.iam.apigw_lambda_role_arn
  dynamodb_table_name = var.table_name
  uploads_bucket_name = module.s3_buckets.uploads_bucket_name
  compressed_bucket_name = module.s3_buckets.processed_bucket_name
}