variable "region" {
  description = "AWS region. Frankfurt is the closest to Czechia."
  type        = string
  default     = "eu-central-1"
}

variable "instance_type" {
  description = "ARM (Graviton) instance. The whole stack takes about 800 MB of RAM."
  type        = string
  default     = "t4g.small"
}

variable "ssh_public_key_path" {
  description = "Public key allowed to SSH in as the ubuntu user."
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_allowed_cidr" {
  description = "Who may connect over SSH, ideally only your IP: curl -s https://checkip.amazonaws.com, then append /32."
  type        = string
}

variable "repository_url" {
  description = "Cloned to the server on its first boot."
  type        = string
  default     = "https://github.com/michalvotipka/ai-mood.git"
}

variable "budget_limit_usd" {
  description = "Monthly cost budget of the whole account. Above 80 % of it an e-mail is sent."
  type        = number
  default     = 10
}

variable "budget_alert_email" {
  description = "Where the budget alerts go."
  type        = string
}
