terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "=6.39.0"
    }
  }

  backend "s3" {
    bucket       = "terraform-backend-bucket-017777088168-us-east-1-an"
    key          = "terraformState/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}


# default provider for most resources
provider "aws" {
  region = var.aws_region
}

# dedicated provider for ACM in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}