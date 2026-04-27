resource "aws_sns_topic" "ops_alerts" {
  name              = "image-compressor-ops-alerts"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "ops_alerts_email_target" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.admin_email
}