# AWS Deployment Quick Start Guide

This document provides a quick reference for deploying BitwiseLearn to AWS.

## 📋 Checklist Before Deployment

- [ ] AWS Account created with appropriate permissions
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker installed locally
- [ ] Repository cloned locally
- [ ] Environment variables configured (see below)

## 🚀 Quick Deploy Steps

### 1. Set Environment Variables

```bash
# Set your AWS configuration
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="us-east-1"
export IMAGE_TAG="v1.0.0"
export PROJECT_NAME="bitwise"
export ENV_NAME="production"
```

### 2. Create .env.prod File

```bash
# Copy the example environment file
cp .env.prod.example .env.prod

# Edit with your AWS-specific values
# Key values to set:
# - DATABASE_URL (AWS RDS or DocumentDB)
# - MQ_CLIENT (AWS MQ or self-hosted RabbitMQ)
# - JWT_SECRET (use a secure random value)
# - AWS S3 credentials (if using S3)
# - Email configuration (AWS SES recommended)
```

### 3. Validate AWS Setup

```bash
# Run validation script to check all prerequisites
chmod +x scripts/validate-aws-setup.sh
./scripts/validate-aws-setup.sh
```

### 4. Build & Push Docker Images to ECR

```bash
# Make the script executable
chmod +x scripts/aws-build-push.sh

# Build and push all images
./scripts/aws-build-push.sh
```

Expected output shows all services being pushed to ECR.

### 5. Follow Full Deployment Guide

For complete step-by-step deployment including:
- Creating ECR repositories
- Setting up CloudWatch logs
- Configuring ECS cluster
- Creating task definitions
- Deploying services

See: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)

## 📁 What Changed in Your Project

### New/Updated Files

1. **Dockerfiles** - All services updated with:
   - Multi-stage builds for smaller images
   - Non-root user execution (security)
   - Health checks
   - Proper signal handling

2. **docker-compose.prod.yml** - Production deployment file for AWS ECS with:
   - ECR image references
   - AWS CloudWatch logging
   - Environment variable configuration
   - Health checks

3. **AWS_DEPLOYMENT.md** - Comprehensive guide covering:
   - Prerequisites and permissions
   - AWS resource setup (ECR, CloudWatch, IAM)
   - Building and pushing images
   - ECS configuration
   - Monitoring and troubleshooting

4. **Helper Scripts**:
   - `scripts/aws-build-push.sh` - Automated build and push
   - `scripts/validate-aws-setup.sh` - Pre-deployment validation

5. **Configuration**:
   - `.env.prod.example` - Environment template for production
   - `.dockerignore` - Optimized Docker builds

6. **Frontend**:
   - `frontend/Dockerfile` - Multi-stage Next.js build

## 🔧 Architecture

### Services Deployed to ECS

```
┌─────────────────────────────────────────────┐
│           AWS Application Load Balancer     │
│                (Port 80/443)                │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────────┬────────────────┐
        │                     │                │
    Frontend              Gateway          (Optional)
    (Next.js)            (FastAPI)         Load Balancer
    Port 3000            Port 8000
        │                     │
        │         ┌───────────┼───────────┬────────────────┬──────────────┐
        │         │           │           │                │              │
      Auth    Course     Problem      Assessment       Notification    Report
     Service   Service   Service       Service          Service        Service
    (8001)   (8003)     (8004)        (8005)          (8007)          (8008)
        │         │           │           │                │              │
        └─────────┴───────────┴───────────┴────────────────┴──────────────┘
                               │
                            ┌──┴──┐
                       ┌────┤     ├────┐
                       │    │     │    │
                    (Shared Services)
                    - MongoDB/RDS
                    - RabbitMQ/AWS MQ
                    - Piston (Code Execution)
```

### Key AWS Services Used

- **ECR** (Elastic Container Registry) - Container image storage
- **ECS** (Elastic Container Service) - Container orchestration
- **CloudWatch Logs** - Centralized logging
- **RDS/DocumentDB** - Database (managed)
- **AWS MQ** - Message queue (managed)
- **S3** - File storage (optional)
- **SES** - Email service (optional)
- **ALB** - Load balancing (optional)

## 📊 Docker Image Improvements

### Multi-Stage Builds
- Separates build dependencies from runtime
- Significantly reduces final image size
- Faster deployment to ECR

### Security Improvements
- Non-root user execution (appuser UID 1000)
- Read-only filesystems where possible
- No unnecessary tools in production images

### Operational Improvements
- Built-in health checks
- Standardized logging configuration
- Environment variable management
- Proper signal handling (SIGTERM/SIGKILL)

## 🔒 Security Best Practices

1. **Environment Variables**: Store sensitive data in AWS Secrets Manager
   ```bash
   aws secretsmanager create-secret --name bitwise/prod/database-url \
     --secret-string "mongodb://..."
   ```

2. **IAM Roles**: Use least-privilege principle
   ```bash
   # Attach specific policies to BitwiseECSTaskRole
   aws iam attach-role-policy --role-name BitwiseECSTaskRole \
     --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess
   ```

3. **Network Security**: Use security groups
   ```bash
   # Only allow traffic from ALB
   aws ec2 authorize-security-group-ingress --group-id sg-xxx \
     --protocol tcp --port 8000 --source-group sg-alb
   ```

4. **Image Scanning**: Enable ECR image scanning
   ```bash
   aws ecr put-image-scanning-configuration \
     --repository-name bitwise-gateway \
     --image-scanning-configuration scanOnPush=true
   ```

## 📈 Scaling Configuration

### Recommended Auto-Scaling Policies

```bash
# For high-traffic services (gateway, auth)
Min: 2, Desired: 3, Max: 10
Target CPU: 70%

# For medium-traffic services (course, problem)
Min: 1, Desired: 2, Max: 5
Target CPU: 75%

# For low-traffic services (notification, report)
Min: 1, Desired: 1, Max: 3
Target CPU: 80%
```

## 🐛 Troubleshooting

### Image Pull Errors
```bash
# Verify ECR login
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Check image exists
aws ecr describe-images --repository-name bitwise-gateway \
  --query 'imageDetails[].imageTags'
```

### Service Health Check Failures
```bash
# Check health check logs
aws logs tail /ecs/bitwise-gateway --follow

# Test health endpoint locally
docker run --rm bitwise-gateway:latest \
  python -c "import urllib.request; \
  urllib.request.urlopen('http://localhost:8000/docs').read()"
```

### Database Connection Issues
```bash
# Verify database connectivity
docker run --rm -it ubuntu:latest bash
apt-get update && apt-get install -y mongodb-mongosh
mongosh "mongodb://..." --eval "db.adminCommand('ping')"
```

## 📚 Additional Resources

- **AWS Documentation**
  - [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/best_practices.html)
  - [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
  - [ECR Documentation](https://docs.aws.amazon.com/AmazonECR/)

- **Docker Best Practices**
  - [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
  - [Docker Security](https://docs.docker.com/engine/security/)

- **Project Documentation**
  - [ARCHITECTURE.md](ARCHITECTURE.md) - Project architecture
  - [README.md](README.md) - General project info

## 🤝 Support

For issues or questions:
1. Check AWS CloudWatch logs: `aws logs tail /ecs/bitwise-gateway --follow`
2. Review ECS service events: `aws ecs describe-services --cluster bitwise-production --services gateway-service`
3. Consult AWS support or open an issue on GitHub

## ✅ Post-Deployment Checklist

- [ ] All services are running (check ECS console)
- [ ] Frontend is accessible via ALB DNS
- [ ] API endpoints respond correctly
- [ ] Database connections are established
- [ ] Logs are appearing in CloudWatch
- [ ] Auto-scaling policies are active
- [ ] Backups are configured for databases
- [ ] Monitoring alerts are set up
- [ ] SSL/TLS certificates are valid
- [ ] DNS is pointing to ALB

---

**Last Updated**: March 2026
**Docker Images**: All services use Python 3.12-slim or Node 20-alpine
**ECS Launch Type**: Fargate (serverless containers)
