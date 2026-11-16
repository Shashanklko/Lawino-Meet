# =========================================================================
# AWS RDS MySQL Free Tier Configuration (100% $0 Cost)
# - Single-AZ db.t3.micro (750 hours/month Free Tier)
# - 20 GB General Purpose SSD (gp2) storage
# - Automated multi-database hosting across all 6 microservices
# =========================================================================

# Security Group for RDS MySQL (Port 3306)
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow inbound MySQL traffic from backend services"

  ingress {
    description = "MySQL database traffic"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Can be restricted to EC2 instance IP or VPC CIDR
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# Parameter Group for MySQL 8.0 with full UTF-8 Support
resource "aws_db_parameter_group" "mysql_params" {
  name   = "${var.project_name}-mysql8-params"
  family = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  parameter {
    name  = "max_connections"
    value = "150"
  }
}

# Free Tier Eligible RDS MySQL Instance
resource "aws_db_instance" "mysql_free_tier" {
  identifier        = var.db_instance_identifier
  engine            = "mysql"
  engine_version     = "8.0"
  instance_class    = var.db_instance_class     # db.t3.micro (Free Tier)
  allocated_storage = var.db_allocated_storage # 20 GB (Free Tier)
  storage_type      = "gp2"

  username = var.db_master_username
  password = var.db_master_password
  port     = 3306

  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  parameter_group_name   = aws_db_parameter_group.mysql_params.name

  # Must remain Single-AZ for AWS Free Tier (Multi-AZ is not eligible for free tier)
  multi_az               = false
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 1 # 1 day automated snapshot

  tags = {
    Name = "${var.project_name}-rds-free-tier"
  }
}
