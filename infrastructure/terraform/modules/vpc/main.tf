#================================== VPC =================================#

resource "aws_vpc" "imageCompressionVPC" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
  instance_tenancy     = "default"
}


#================================== Private Subnets =================================#

resource "aws_subnet" "imageCompressionPrivateSubnet1" {
  vpc_id            = aws_vpc.imageCompressionVPC.id
  cidr_block        = var.subnet_cidrs[0]
  availability_zone = var.availability_zones[0]

  tags = {
    Name = "imageCompressionPrivateSubnet1"
  }
}

resource "aws_subnet" "imageCompressionPrivateSubnet2" {
  vpc_id            = aws_vpc.imageCompressionVPC.id
  cidr_block        = var.subnet_cidrs[1]
  availability_zone = var.availability_zones[1]

  tags = {
    Name = "imageCompressionPrivateSubnet2"
  }
}

#=============================== Public Subnets ======================================#

resource "aws_subnet" "imageCompressionPublicSubnet1" {
  vpc_id                  = aws_vpc.imageCompressionVPC.id
  cidr_block              = var.subnet_cidrs[2]
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "imageCompressionPublicSubnet1"
  }
}

resource "aws_subnet" "imageCompressionPublicSubnet2" {
  vpc_id                  = aws_vpc.imageCompressionVPC.id
  cidr_block              = var.subnet_cidrs[3]
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "imageCompressionPublicSubnet2"
  }
}


#================================== NAT Gateway, Internet Gateway, elastic IPs =================================#

resource "aws_eip" "imageCompressionNatGatewayEip1" {
  domain = "vpc"
}

resource "aws_eip" "imageCompressionNatGatewayEip2" {
  domain = "vpc"
}

resource "aws_internet_gateway" "imageCompressionInternetGateway" {
  vpc_id = aws_vpc.imageCompressionVPC.id

  tags = {
    Name = "imageCompressionInternetGateway"
  }
}

resource "aws_nat_gateway" "imageCompressionNatGateway" {
  vpc_id            = aws_vpc.imageCompressionVPC.id
  availability_mode = "regional"

  availability_zone_address {
    allocation_ids    = [aws_eip.imageCompressionNatGatewayEip1.id]
    availability_zone = var.availability_zones[0]
  }
  availability_zone_address {
    allocation_ids    = [aws_eip.imageCompressionNatGatewayEip2.id]
    availability_zone = var.availability_zones[1]
  }

  depends_on = [aws_internet_gateway.imageCompressionInternetGateway]
}


#================================== Route Tables =================================#

resource "aws_route_table" "imageCompressionPublicRouteTable" {
  vpc_id = aws_vpc.imageCompressionVPC.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.imageCompressionInternetGateway.id
  }

  tags = {
    Name = "imageCompressionPublicRouteTable"
  }
}

resource "aws_route_table" "imageCompressionPrivateRouteTable" {
  vpc_id = aws_vpc.imageCompressionVPC.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.imageCompressionNatGateway.id
  }

  tags = {
    Name = "imageCompressionPrivateRouteTable"
  }
}


resource "aws_route_table_association" "imageCompressionRouteTableAssociation1" {
  subnet_id      = aws_subnet.imageCompressionPrivateSubnet1.id
  route_table_id = aws_route_table.imageCompressionPrivateRouteTable.id
}

resource "aws_route_table_association" "imageCompressionRouteTableAssociation2" {
  subnet_id      = aws_subnet.imageCompressionPrivateSubnet2.id
  route_table_id = aws_route_table.imageCompressionPrivateRouteTable.id
}

resource "aws_route_table_association" "imageCompressionRouteTableAssociation3" {
  subnet_id      = aws_subnet.imageCompressionPublicSubnet1.id
  route_table_id = aws_route_table.imageCompressionPublicRouteTable.id
}

resource "aws_route_table_association" "imageCompressionRouteTableAssociation4" {
  subnet_id      = aws_subnet.imageCompressionPublicSubnet2.id
  route_table_id = aws_route_table.imageCompressionPublicRouteTable.id
}

