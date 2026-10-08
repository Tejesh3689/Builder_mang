provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

resource "aws_db_parameter_group" "postgres_utf8" {
  name   = "builder-postgres15-utf8"
  family = "postgres15"

  parameter {
    name  = "client_encoding"
    value = "UTF8"
  }
}

# PostgreSQL RDS Instance
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  db_name              = "builder_management"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t4g.micro"
  username             = "builder_admin"
  password             = var.db_password
  parameter_group_name = aws_db_parameter_group.postgres_utf8.name
  skip_final_snapshot  = true
}

# Redis ElastiCache Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "builder-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# S3 Bucket for documents and chat files
resource "aws_s3_bucket" "assets" {
  bucket = "builder-management-assets-prod"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  cors_rule {
    allowed_origins = ["https://app.example.com"] # Replace with production origin
    allowed_methods = ["GET"]
    allowed_headers = ["*"]
  }
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}
