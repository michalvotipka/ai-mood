# One server in the default VPC running the stack from docker-compose.prod.yml.

data "aws_vpc" "default" {
  default = true
}

# The current Ubuntu 24.04 LTS image for ARM, published by Canonical.
data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id"
}

resource "aws_key_pair" "deploy" {
  key_name   = "ai-mood"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_security_group" "server" {
  name        = "ai-mood-server"
  description = "HTTP(S) from anywhere, SSH from the admin only"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.server.id
  description       = "SSH"
  cidr_ipv4         = var.ssh_allowed_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.server.id
  description       = "HTTP, redirected to HTTPS by Caddy (and Let's Encrypt challenges)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.server.id
  description       = "HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "http3" {
  security_group_id = aws_security_group.server.id
  description       = "HTTP/3"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "udp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.server.id
  description       = "Outgoing traffic (packages, images, Let's Encrypt, AI Gateway)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_instance" "server" {
  ami                    = data.aws_ssm_parameter.ubuntu_ami.value
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deploy.key_name
  vpc_security_group_ids = [aws_security_group.server.id]

  user_data = templatefile("${path.module}/user-data.sh", {
    repository_url = var.repository_url
  })

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  # Instance metadata only with session tokens (IMDSv2).
  metadata_options {
    http_tokens = "required"
  }

  # A newer Ubuntu image must not replace the running server (and its data) on the next apply.
  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = {
    Name = "ai-mood"
  }
}

# A fixed public IP: DNS records keep pointing to it when the instance is stopped or replaced.
resource "aws_eip" "server" {
  instance = aws_instance.server.id
  domain   = "vpc"

  tags = {
    Name = "ai-mood"
  }
}

resource "aws_budgets_budget" "monthly" {
  name         = "ai-mood-monthly"
  budget_type  = "COST"
  limit_amount = var.budget_limit_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
