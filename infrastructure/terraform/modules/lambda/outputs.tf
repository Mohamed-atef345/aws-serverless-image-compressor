output "apigw_lambda_invoke_arn" {
  value = aws_lambda_function.apigw_lambda.invoke_arn
}

output "apigw_lambda_name" {
  value = aws_lambda_function.apigw_lambda.function_name
}