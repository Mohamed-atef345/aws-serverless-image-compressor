resource "aws_cloudwatch_dashboard" "ops_overview" {
  dashboard_name = var.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Errors and Throttles"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.apigw_lambda_name, { "label" : "API Errors" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.apigw_lambda_name, { "label" : "API Throttles" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.worker_lambda_name, { "label" : "Worker Errors" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.worker_lambda_name, { "label" : "Worker Throttles" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Duration P95 (ms)"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.apigw_lambda_name, { "label" : "API Duration p95", "stat" : "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.worker_lambda_name, { "label" : "Worker Duration p95", "stat" : "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway 4XX and 5XX"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_name, "Stage", var.api_stage_name, { "label" : "4XX" }],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_name, "Stage", var.api_stage_name, { "label" : "5XX" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway Latency P95 (ms)"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_name, "Stage", var.api_stage_name, { "label" : "Latency p95", "stat" : "p95" }],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiName", var.api_name, "Stage", var.api_stage_name, { "label" : "Integration Latency p95", "stat" : "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "SQS Backlog and DLQ"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          metrics = [
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", var.sqs_queue_name, { "label" : "Oldest Message Age" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_queue_name, { "label" : "Main Queue Visible" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_dlq_name, { "label" : "DLQ Visible" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "DynamoDB Health"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", var.dynamodb_table_name, { "label" : "Throttled Requests" }],
            ["AWS/DynamoDB", "SystemErrors", "TableName", var.dynamodb_table_name, { "label" : "System Errors" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "CloudFront Error Rates"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          metrics = [
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { "label" : "5xx Error Rate" }],
            ["AWS/CloudFront", "TotalErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { "label" : "Total Error Rate" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "WAF Blocked Requests"
          view    = "timeSeries"
          region  = var.aws_region
          stacked = false
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AWS/WAFV2", "BlockedRequests", "WebACL", var.cloudfront_waf_acl_name, "Region", "Global", "Rule", "ALL", { "label" : "CloudFront WAF Blocked" }],
            ["AWS/WAFV2", "BlockedRequests", "WebACL", var.api_gateway_waf_acl_name, "Region", var.aws_region, "Rule", "ALL", { "label" : "API Gateway WAF Blocked" }]
          ]
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          title  = "API Lambda Error Logs"
          region = var.aws_region
          view   = "table"
          query  = "SOURCE '/aws/lambda/${var.apigw_lambda_name}' | fields @timestamp, @message | filter @message like /ERROR|Exception|Traceback/ | sort @timestamp desc | limit 50"
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          title  = "Worker Lambda Error Logs"
          region = var.aws_region
          view   = "table"
          query  = "SOURCE '/aws/lambda/${var.worker_lambda_name}' | fields @timestamp, @message | filter @message like /ERROR|Exception|Traceback/ | sort @timestamp desc | limit 50"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 30
        width  = 24
        height = 6
        properties = {
          title  = "API Gateway 4XX/5XX Access Logs"
          region = var.aws_region
          view   = "table"
          query  = "SOURCE '/aws/apigateway/image-compression-api-v1-access' | fields @timestamp, @message | filter @message like /\"status\":\"4/ or @message like /\"status\":\"5/ | sort @timestamp desc | limit 50"
        }
      }
    ]
  })
}
