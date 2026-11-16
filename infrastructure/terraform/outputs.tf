output "rds_endpoint" {
  description = "Complete RDS endpoint string (host:port)"
  value       = aws_db_instance.mysql_free_tier.endpoint
}

output "rds_host" {
  description = "Hostname of the RDS MySQL instance"
  value       = aws_db_instance.mysql_free_tier.address
}

output "rds_port" {
  description = "Port of the RDS MySQL instance"
  value       = aws_db_instance.mysql_free_tier.port
}

output "rds_master_username" {
  description = "Master database username"
  value       = aws_db_instance.mysql_free_tier.username
}

output "s3_bucket_name" {
  description = "S3 bucket for document & profile photo uploads"
  value       = aws_s3_bucket.lawino_assets.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.lawino_assets.arn
}

output "ec2_swarm_manager_ip" {
  description = "Public IP of the Swarm Manager / Gateway EC2 instance"
  value       = aws_instance.swarm_manager.public_ip
}

output "ec2_swarm_manager_dns" {
  description = "Public DNS of the Swarm Manager / Gateway EC2 instance"
  value       = aws_instance.swarm_manager.public_dns
}

output "spring_boot_jdbc_url_sample" {
  description = "Sample JDBC connection URL for Spring Boot microservices"
  value       = "jdbc:mysql://${aws_db_instance.mysql_free_tier.address}:3306/auth_db?createDatabaseIfNotExist=true&useSSL=true&allowPublicKeyRetrieval=true"
}
