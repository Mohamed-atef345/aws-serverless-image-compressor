terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

data "aws_route53_zone" "my_domain" {
  name = var.domain_name
}

resource "aws_acm_certificate" "my_domain" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = var.validation_method
}

resource "aws_route53_record" "my_domain" {
  for_each = {
    for dvo in aws_acm_certificate.my_domain.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.my_domain.zone_id
}

resource "aws_acm_certificate_validation" "my_domain" {
  certificate_arn         = aws_acm_certificate.my_domain.arn
  validation_record_fqdns = [for record in aws_route53_record.my_domain : record.fqdn]
}
