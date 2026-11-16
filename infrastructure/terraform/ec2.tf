# =========================================================================
# AWS EC2 Swarm Manager / Host Instance
# =========================================================================

# Security Group for EC2 Web Server & Docker Swarm
resource "aws_security_group" "ec2_sg" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow inbound HTTP/HTTPS and SSH to LawinoMeet EC2 Host"

  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Public Web Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Secure Web Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Docker Swarm Node Cluster Management Ports
  ingress {
    description = "Docker Swarm cluster management"
    from_port   = 2377
    to_port     = 2377
    protocol    = "tcp"
    self        = true
  }

  ingress {
    description = "Docker Swarm node communication TCP"
    from_port   = 7946
    to_port     = 7946
    protocol    = "tcp"
    self        = true
  }

  ingress {
    description = "Docker Swarm node communication UDP"
    from_port   = 7946
    to_port     = 7946
    protocol    = "udp"
    self        = true
  }

  ingress {
    description = "Docker Swarm overlay network traffic"
    from_port   = 4789
    to_port     = 4789
    protocol    = "udp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# Lookup Latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# EC2 Instance for Docker Swarm Host / Gateway
resource "aws_instance" "swarm_manager" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small" # or t3.micro for 100% Free Tier
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  root_block_device {
    volume_size           = 30 # Up to 30 GB EBS is Free Tier eligible
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release git

              # Install Docker CE
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

              # Add ubuntu user to docker group
              usermod -aG docker ubuntu

              # Initialize Docker Swarm
              docker swarm init || true
              EOF

  tags = {
    Name = "${var.project_name}-swarm-manager"
  }
}
