# =========================================================================
# AWS CloudWatch Centralized Logging & Health Alarms
# =========================================================================

# Centralized Log Group for Microservices & Gateway
resource "aws_cloudwatch_log_group" "lawino_logs" {
  name              = "/lawino-meet/production"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-logs"
  }
}

# CPU Utilization Alarm for Swarm Manager
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "${var.project_name}-ec2-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm when EC2 Swarm Manager CPU exceeds 80% for 10 minutes"

  dimensions = {
    InstanceId = aws_instance.swarm_manager.id
  }
}

# Free Tier Database Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-rds-free-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB in Bytes
  alarm_description   = "Alarm when RDS Free Storage drops below 2 GB"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.mysql_free_tier.id
  }
}
