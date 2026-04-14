data "aws_route53_zone" "selected" {
  name         = var.domain_name
}

resource "aws_route53_record" "compression" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = "compression.${var.domain_name}"
  type    = var.record_type
  alias {
    name                   = var.cloudfront_distribution_domain_name
    zone_id                = var.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

