output "dynamodb_table_arn" {
    value = aws_dynamodb_table.image_compression_metadata.arn
}

output "dynamodb_table_name" {
    value = aws_dynamodb_table.image_compression_metadata.name
}