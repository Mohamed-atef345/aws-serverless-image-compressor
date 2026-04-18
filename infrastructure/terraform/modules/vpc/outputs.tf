output "vpc_id" {
  value = aws_vpc.imageCompressionVPC.id
}

output "private_subnet_ids" {
  value = [
    aws_subnet.imageCompressionPrivateSubnet1.id,
    aws_subnet.imageCompressionPrivateSubnet2.id
  ]
}

output "public_subnet_ids" {
  value = [
    aws_subnet.imageCompressionPublicSubnet1.id,
    aws_subnet.imageCompressionPublicSubnet2.id
  ]
}

output "nat_gateway_id" {
  value = aws_nat_gateway.imageCompressionNatGateway.id
}