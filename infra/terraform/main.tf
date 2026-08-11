provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
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
  parameter_group_name = "default.postgres15"
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

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}
