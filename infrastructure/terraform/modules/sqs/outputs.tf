output "image_uploads_queue_arn" {
  value = aws_sqs_queue.image_uploads_queue.arn
}

output "image_uploads_queue_name" {
  value = aws_sqs_queue.image_uploads_queue.name
}

output "image_uploads_deadletter_queue_name" {
  value = aws_sqs_queue.image_uploads_deadletter_queue.name
}
