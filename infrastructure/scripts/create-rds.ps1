# =========================================================================
# LawinoMeet - 1-Click AWS Free Tier RDS MySQL & S3 Provisioning Script
# Requirements: AWS CLI installed and configured (`aws configure`)
# Cost: $0 (100% Free Tier: db.t3.micro, 20GB gp2 SSD, Single-AZ)
# =========================================================================

param (
    [string]$Region = "us-east-1",
    [string]$DbIdentifier = "lawino-rds-mysql",
    [string]$MasterUsername = "admin",
    [string]$MasterPassword = "LawinoMeet2026SecurePass!",
    [string]$S3BucketName = "lawino-meet-assets-$(Get-Random -Minimum 1000 -Maximum 9999)"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  LawinoMeet AWS Free Tier Setup (RDS MySQL + S3)" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Target AWS Region: $Region"
Write-Host "RDS Instance ID  : $DbIdentifier (db.t3.micro, 20GB gp2)"
Write-Host "S3 Bucket Name   : $S3BucketName"
Write-Host ""

# 1. Check AWS CLI Authentication
Write-Host "[1/5] Verifying AWS Identity..." -ForegroundColor Green
$identity = aws sts get-caller-identity --output json 2>$null
if (-not $identity) {
    Write-Host "ERROR: AWS CLI is not configured or credentials have expired." -ForegroundColor Red
    Write-Host "Please run 'aws configure' first."
    exit 1
}
$accountId = ($identity | ConvertFrom-Json).Account
Write-Host "Authenticated with AWS Account: $accountId" -ForegroundColor DarkGreen

# 2. Create S3 Bucket for Profile Photos & Chat Files
Write-Host "[2/5] Creating S3 Storage Bucket..." -ForegroundColor Green
if ($Region -eq "us-east-1") {
    aws s3api create-bucket --bucket $S3BucketName --region $Region
} else {
    aws s3api create-bucket --bucket $S3BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
}

# Apply CORS to S3 Bucket
$corsConfig = '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedOrigins":["*"],"ExposeHeaders":["ETag"]}]}'
aws s3api put-bucket-cors --bucket $S3BucketName --cors-configuration $corsConfig
Write-Host "S3 Bucket '$S3BucketName' created with CORS enabled." -ForegroundColor DarkGreen

# 3. Create Security Group for RDS MySQL
Write-Host "[3/5] Setting up RDS Security Group..." -ForegroundColor Green
$sgName = "lawino-rds-sg"
$sgDesc = "LawinoMeet RDS MySQL Security Group"
$existingSg = aws ec2 describe-security-groups --group-names $sgName --region $Region --query "SecurityGroups[0].GroupId" --output text 2>$null

if (-not $existingSg -or $existingSg -eq "None") {
    $sgId = aws ec2 create-security-group --group-name $sgName --description $sgDesc --region $Region --query "GroupId" --output text
    aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3306 --cidr 0.0.0.0/0 --region $Region
    Write-Host "Created Security Group: $sgId with Port 3306 open" -ForegroundColor DarkGreen
} else {
    $sgId = $existingSg
    Write-Host "Using existing Security Group: $sgId" -ForegroundColor DarkGreen
}

# 4. Provision Free Tier RDS MySQL Instance
Write-Host "[4/5] Provisioning RDS MySQL Free Tier (db.t3.micro, 20GB)..." -ForegroundColor Green
Write-Host "Note: AWS RDS creation typically takes 4-8 minutes. Please wait..." -ForegroundColor Yellow

aws rds create-db-instance `
    --db-instance-identifier $DbIdentifier `
    --db-instance-class db.t3.micro `
    --engine mysql `
    --engine-version 8.0 `
    --allocated-storage 20 `
    --storage-type gp2 `
    --master-username $MasterUsername `
    --master-user-password $MasterPassword `
    --vpc-security-group-ids $sgId `
    --no-multi-az `
    --publicly-accessible `
    --backup-retention-period 1 `
    --region $Region

Write-Host "RDS Instance creation request dispatched." -ForegroundColor Green
Write-Host "Waiting for RDS instance to become available..." -ForegroundColor Yellow

aws rds wait db-instance-available --db-instance-identifier $DbIdentifier --region $Region

$endpoint = aws rds describe-db-instances --db-instance-identifier $DbIdentifier --region $Region --query "DBInstances[0].Endpoint.Address" --output text

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  AWS FREE TIER PROVISIONING COMPLETE!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "RDS Host Endpoint : $endpoint" -ForegroundColor White
Write-Host "Port              : 3306" -ForegroundColor White
Write-Host "Master Username   : $MasterUsername" -ForegroundColor White
Write-Host "S3 Bucket         : $S3BucketName" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEP: Update your .env file with:" -ForegroundColor Yellow
Write-Host "MYSQL_HOST=$endpoint" -ForegroundColor Cyan
Write-Host "MYSQL_PORT=3306" -ForegroundColor Cyan
Write-Host "MYSQL_USER=$MasterUsername" -ForegroundColor Cyan
Write-Host "MYSQL_PASSWORD=$MasterPassword" -ForegroundColor Cyan
Write-Host "AWS_REGION=$Region" -ForegroundColor Cyan
Write-Host "AWS_S3_BUCKET_NAME=$S3BucketName" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
