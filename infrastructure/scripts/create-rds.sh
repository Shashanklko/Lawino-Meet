#!/usr/bin/env bash
# =========================================================================
# LawinoMeet - 1-Click AWS Free Tier RDS MySQL & S3 Provisioning (Bash)
# =========================================================================

set -e

REGION="${AWS_REGION:-us-east-1}"
DB_IDENTIFIER="${DB_IDENTIFIER:-lawino-rds-mysql}"
MASTER_USERNAME="${DB_USER:-admin}"
MASTER_PASSWORD="${DB_PASSWORD:-LawinoMeet2026SecurePass!}"
RAND_SUFFIX=$(head /dev/urandom | tr -dc 0-9 | head -c 4 || echo "2026")
S3_BUCKET_NAME="${S3_BUCKET:-lawino-meet-assets-$RAND_SUFFIX}"

echo "========================================================="
echo "  LawinoMeet AWS Free Tier Setup (RDS MySQL + S3)"
echo "========================================================="
echo "Target AWS Region : $REGION"
echo "RDS Instance ID   : $DB_IDENTIFIER (db.t3.micro, 20GB gp2)"
echo "S3 Bucket Name    : $S3_BUCKET_NAME"
echo ""

# 1. Check AWS CLI Authentication
echo "[1/5] Verifying AWS Identity..."
aws sts get-caller-identity > /dev/null

# 2. Create S3 Bucket
echo "[2/5] Creating S3 Storage Bucket..."
if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$S3_BUCKET_NAME" --region "$REGION" || true
else
    aws s3api create-bucket --bucket "$S3_BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION" || true
fi

aws s3api put-bucket-cors --bucket "$S3_BUCKET_NAME" --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedOrigins":["*"],"ExposeHeaders":["ETag"]}]}'

# 3. Security Group
echo "[3/5] Setting up RDS Security Group..."
SG_NAME="lawino-rds-sg"
SG_ID=$(aws ec2 describe-security-groups --group-names "$SG_NAME" --region "$REGION" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "")

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "LawinoMeet RDS MySQL SG" --region "$REGION" --query "GroupId" --output text)
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3306 --cidr 0.0.0.0/0 --region "$REGION"
fi

# 4. Provision Free Tier RDS MySQL Instance
echo "[4/5] Provisioning RDS MySQL Free Tier (db.t3.micro, 20GB)..."
aws rds create-db-instance \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0 \
    --allocated-storage 20 \
    --storage-type gp2 \
    --master-username "$MASTER_USERNAME" \
    --master-user-password "$MASTER_PASSWORD" \
    --vpc-security-group-ids "$SG_ID" \
    --no-multi-az \
    --publicly-accessible \
    --backup-retention-period 1 \
    --region "$REGION" || true

echo "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --db-instance-identifier "$DB_IDENTIFIER" --region "$REGION"

ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier "$DB_IDENTIFIER" --region "$REGION" --query "DBInstances[0].Endpoint.Address" --output text)

echo "========================================================="
echo "  AWS FREE TIER PROVISIONING COMPLETE!"
echo "========================================================="
echo "RDS Host Endpoint : $ENDPOINT"
echo "Port              : 3306"
echo "Master Username   : $MASTER_USERNAME"
echo "S3 Bucket         : $S3_BUCKET_NAME"
echo ""
echo "Update your .env file with:"
echo "MYSQL_HOST=$ENDPOINT"
echo "MYSQL_PORT=3306"
echo "MYSQL_USER=$MASTER_USERNAME"
echo "MYSQL_PASSWORD=$MASTER_PASSWORD"
echo "AWS_REGION=$REGION"
echo "AWS_S3_BUCKET_NAME=$S3_BUCKET_NAME"
echo "========================================================="
