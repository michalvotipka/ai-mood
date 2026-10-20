terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # State stays local (terraform.tfstate, gitignored). Later it can move to an S3 backend.
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project = "ai-mood"
    }
  }
}
