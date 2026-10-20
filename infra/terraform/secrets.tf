# Production configuration of the app (passwords, API keys, domains) as one JSON secret. Terraform
# creates it empty, so the values never get into terraform.tfstate: deploy/init-secret.sh fills it,
# the AI Gateway key is added in the AWS console.
resource "aws_secretsmanager_secret" "app" {
  name        = "ai-mood/prod"
  description = "Environment of docker-compose.prod.yml, read by deploy/compose.sh on the server"

  # Deleted right away on terraform destroy, so the same name can be created again.
  recovery_window_in_days = 0
}

# The server's identity in AWS: it may read this one secret, without any access keys on the server.
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "server" {
  name               = "ai-mood-server"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

data "aws_iam_policy_document" "read_app_secret" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app.arn]
  }
}

resource "aws_iam_role_policy" "read_app_secret" {
  name   = "read-app-secret"
  role   = aws_iam_role.server.id
  policy = data.aws_iam_policy_document.read_app_secret.json
}

resource "aws_iam_instance_profile" "server" {
  name = "ai-mood-server"
  role = aws_iam_role.server.name
}
