variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for tags and resources"
  type        = string
  default     = "lawino-meet"
}

variable "db_instance_identifier" {
  description = "RDS MySQL instance identifier"
  type        = string
  default     = "lawino-rds-mysql"
}

variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro is AWS Free Tier eligible)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Storage size in GB (up to 20 GB is AWS Free Tier eligible)"
  type        = number
  default     = 20
}

variable "db_master_username" {
  description = "Master username for RDS MySQL"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS MySQL (minimum 8 characters)"
  type        = string
  default     = "LawinoMeet2026SecurePass!"
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "S3 bucket for profile images and chat documents"
  type        = string
  default     = "lawino-meet-assets"
}
