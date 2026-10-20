#!/bin/bash
# First boot only: Docker, AWS CLI, swap, and a clone of the repository. Log: /var/log/cloud-init-output.log
set -euxo pipefail

# Docker Engine and the compose plugin from Docker's own apt repository.
apt-get update
apt-get install -y ca-certificates curl git jq unzip
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker ubuntu

# AWS CLI v2 (ARM build), deploy/compose.sh reads the app's secret with it through the server's role.
curl -fsSL https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

# 2 GB of RAM is enough to run the stack, building the images on the server needs swap on top.
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

sudo -u ubuntu git clone ${repository_url} /home/ubuntu/ai-mood
