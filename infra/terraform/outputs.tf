locals {
  ip      = aws_eip.server.public_ip
  ip_dash = replace(local.ip, ".", "-")
}

output "public_ip" {
  description = "For the DNS records of the real domain (A records of mood. and auth.mood.)."
  value       = local.ip
}

output "app_domain" {
  description = "APP_DOMAIN until the real domain is set up. sslip.io resolves it to the IP."
  value       = "mood.${local.ip_dash}.sslip.io"
}

output "auth_domain" {
  description = "AUTH_DOMAIN until the real domain is set up."
  value       = "auth.${local.ip_dash}.sslip.io"
}

output "ssh" {
  value = "ssh ubuntu@${local.ip}"
}

output "keycloak_admin_tunnel" {
  description = "Then open http://localhost:48080/admin/"
  value       = "ssh -N -L 48080:localhost:48080 ubuntu@${local.ip}"
}
