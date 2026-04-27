output "api_id" {
  value = aws_api_gateway_rest_api.image_compression_api.id
}

output "api_stage_invoke_url" {
  value = aws_api_gateway_stage.main.invoke_url
}

output "api_execution_arn" {
  value = aws_api_gateway_rest_api.image_compression_api.execution_arn
}

output "api_name" {
  value = aws_api_gateway_rest_api.image_compression_api.name
}

output "api_gateway_stage_arn" {
  value = aws_api_gateway_stage.main.arn
}

output "api_stage_name" {
  value = aws_api_gateway_stage.main.stage_name
}
