# =========================================================================
# AWS S3 Bucket for Profile Photos & Chat Document Sharing
# =========================================================================

resource "aws_s3_bucket" "lawino_assets" {
  bucket        = var.s3_bucket_name
  force_destroy = false

  tags = {
    Name = "${var.project_name}-assets"
  }
}

# Ownership controls
resource "aws_s3_bucket_ownership_controls" "lawino_assets_ownership" {
  bucket = aws_s3_bucket.lawino_assets.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block general public write/read for maximum security
resource "aws_s3_bucket_public_access_block" "lawino_assets_public_block" {
  bucket = aws_s3_bucket.lawino_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS configuration to allow direct browser uploads & downloads
resource "aws_s3_bucket_cors_configuration" "lawino_assets_cors" {
  bucket = aws_s3_bucket.lawino_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "x-amz-server-side-encryption"]
    max_age_seconds = 3000
  }
}
