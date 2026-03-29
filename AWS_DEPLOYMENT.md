# AWS Deployment Guide for BitwiseLearn

This guide provides step-by-step instructions to deploy the BitwiseLearn project to AWS using Elastic Container Registry (ECR) and Elastic Container Service (ECS).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup AWS Resources](#setup-aws-resources)
3. [Build & Push Docker Images to ECR](#build--push-docker-images-to-ecr)
4. [Configure ECS](#configure-ecs)
5. [Deploy to AWS](#deploy-to-aws)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Prerequisites

### Required Tools
- AWS CLI v2 installed and configured
- Docker installed locally
- jq (for JSON parsing)
- AWS Account with appropriate permissions

### AWS Permissions Required
- ECR (Elastic Container Registry) - CreateRepository, PutImage, GetImage
- ECS (Elastic Container Service) - CreateCluster, CreateService, RunTask
- CloudWatch Logs - CreateLogGroup, CreateLogStream, PutLogEvents
- IAM - CreateRole, AttachRolePolicy
- RDS or managed database service (if using managed DB)
- ElastiCache for Redis (optional, for caching)

### Set Environment Variables
```bash
# Replace with your values
export AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"
export AWS_REGION="us-east-1"  # or your preferred region
export IMAGE_TAG="v1.0.0"  # or latest
export PROJECT_NAME="bitwise"
export ENV_NAME="production"
```

---

## Setup AWS Resources

### 1. Create ECR Repositories

Create one ECR repository for each service:

```bash
#!/bin/bash

SERVICES=(
  "gateway"
  "auth-service"
  "user-service"
  "course-service"
  "problem-service"
  "assessment-service"
  "code-service"
  "notification-service"
  "report-service"
  "frontend"
)

for SERVICE in "${SERVICES[@]}"; do
  aws ecr create-repository \
    --repository-name "bitwise-${SERVICE}" \
    --region $AWS_REGION \
    --encryption-type AES \
    || echo "Repository bitwise-${SERVICE} may already exist"
done
```

### 2. Create CloudWatch Log Groups

```bash
#!/bin/bash

SERVICES=(
  "gateway"
  "auth-service"
  "user-service"
  "course-service"
  "problem-service"
  "assessment-service"
  "code-service"
  "notification-service"
  "report-service"
  "frontend"
  "rabbitmq"
  "piston"
)

for SERVICE in "${SERVICES[@]}"; do
  aws logs create-log-group \
    --log-group-name "/ecs/bitwise-${SERVICE}" \
    --region $AWS_REGION \
    || echo "Log group /ecs/bitwise-${SERVICE} may already exist"
done
```

### 3. Create IAM Role for ECS Tasks

```bash
# Create the role
aws iam create-role \
  --role-name BitwiseECSTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach basic ECS task policy
aws iam attach-role-policy \
  --role-name BitwiseECSTaskRole \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

# Create and attach a custom policy for CloudWatch Logs and ECR access
aws iam put-role-policy \
  --role-name BitwiseECSTaskRole \
  --policy-name BitewiseECRAndLogsPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecr:GetAuthorizationToken",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:/ecs/*"
      }
    ]
  }'
```

### 4. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name ${PROJECT_NAME}-${ENV_NAME} \
  --region $AWS_REGION \
  --cluster-settings name=containerInsights,value=enabled
```

---

## Build & Push Docker Images to ECR

### 1. Authenticate Docker with ECR

```bash
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
```

### 2. Build Docker Images

From the project root directory:

```bash
#!/bin/bash

SERVICES=(
  "gateway"
  "auth-service"
  "user-service"
  "course-service"
  "problem-service"
  "assessment-service"
  "code-service"
  "notification-service"
  "report-service"
)

# Build backend services
for SERVICE in "${SERVICES[@]}"; do
  echo "Building $SERVICE..."
  docker build \
    -f "apps/${SERVICE}/Dockerfile" \
    -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}:${IMAGE_TAG}" \
    -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}:latest" \
    .
done

# Build frontend
echo "Building frontend..."
docker build \
  -f "frontend/Dockerfile" \
  -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-frontend:${IMAGE_TAG}" \
  -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-frontend:latest" \
  frontend/
```

### 3. Push Images to ECR

```bash
#!/bin/bash

SERVICES=(
  "gateway"
  "auth-service"
  "user-service"
  "course-service"
  "problem-service"
  "assessment-service"
  "code-service"
  "notification-service"
  "report-service"
  "frontend"
)

for SERVICE in "${SERVICES[@]}"; do
  echo "Pushing bitwise-${SERVICE}:${IMAGE_TAG}..."
  docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}:${IMAGE_TAG}"
  docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}:latest"
done

echo "All images pushed successfully!"
```

---

## Configure ECS

### 1. Create Task Definitions

Create task definitions for each service. Example for gateway service:

```bash
aws ecs register-task-definition \
  --family bitwise-gateway-td \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 \
  --memory 512 \
  --execution-role-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/BitwiseECSTaskRole" \
  --container-definitions '[
    {
      "name": "gateway",
      "image": "'${AWS_ACCOUNT_ID}'.dkr.ecr.'${AWS_REGION}'.amazonaws.com/bitwise-gateway:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AUTH_SERVICE_URL",
          "value": "http://auth-service:8001"
        },
        {
          "name": "USER_SERVICE_URL",
          "value": "http://user-service:8002"
        },
        {
          "name": "COURSE_SERVICE_URL",
          "value": "http://course-service:8003"
        },
        {
          "name": "PROBLEM_SERVICE_URL",
          "value": "http://problem-service:8004"
        },
        {
          "name": "ASSESSMENT_SERVICE_URL",
          "value": "http://assessment-service:8005"
        },
        {
          "name": "CODE_SERVICE_URL",
          "value": "http://code-service:8006"
        },
        {
          "name": "NOTIFICATION_SERVICE_URL",
          "value": "http://notification-service:8007"
        },
        {
          "name": "REPORT_SERVICE_URL",
          "value": "http://report-service:8008"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bitwise-gateway",
          "awslogs-region": "'${AWS_REGION}'",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:8000/docs').read()\" || exit 1"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 5
      }
    }
  ]'
```

### 2. Create ECS Services

```bash
# Get VPC and subnet information
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query 'Subnets[0].SubnetId' --output text)

# Create security group for ECS
SG_ID=$(aws ec2 create-security-group \
  --group-name bitwise-ecs-sg \
  --description "Security group for BitwiseLearn ECS services" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow all traffic within the security group
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 0-65535 \
  --source-group $SG_ID

# Allow HTTP and HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ECS service for gateway
aws ecs create-service \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --service-name gateway-service \
  --task-definition bitwise-gateway-td \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=gateway,containerPort=8000
```

---

## Deploy to AWS

### Option 1: Using Docker Compose with ECS

#### Prerequisites
```bash
# Install Docker Compose with ECS support
pip install docker-compose-ecs
```

#### Deploy
```bash
# Authenticate
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Deploy using compose
docker-compose -f docker-compose.prod.yml up --detach
```

### Option 2: Manual ECS Deployment

```bash
# Update ECS service to use new image
aws ecs update-service \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --service gateway-service \
  --task-definition bitwise-gateway-td:LATEST \
  --force-new-deployment

# Monitor deployment
aws ecs describe-services \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --services gateway-service \
  --query 'services[0].[serviceName,desiredCount,runningCount]' \
  --output table
```

---

## Monitoring & Troubleshooting

### 1. View Logs

```bash
# Use CloudWatch Logs Insights
aws logs start-query \
  --log-group-name /ecs/bitwise-gateway \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | stats count() by @message'
```

### 2. Check Service Health

```bash
# Get service details
aws ecs describe-services \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --services gateway-service \
  --output json | jq '.services[0]'

# Get task status
aws ecs list-tasks \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --service-name gateway-service \
  --output json | jq '.taskArns[]' | while read arn; do
    aws ecs describe-tasks \
      --cluster ${PROJECT_NAME}-${ENV_NAME} \
      --tasks "$arn" \
      --output table
done
```

### 3. Common Issues

**Issue: Image pull failures**
```bash
# Check ECR login
aws ecr describe-repositories --repository-names bitwise-gateway

# Verify image exists
aws ecr describe-images --repository-name bitwise-gateway --query 'imageDetails[].imageTags'
```

**Issue: Tasks failing to start**
```bash
# Check task logs
aws ecs describe-tasks \
  --cluster ${PROJECT_NAME}-${ENV_NAME} \
  --tasks <TASK_ARN> \
  --output json | jq '.tasks[0].containers[0].lastStatus'
```

**Issue: Service not responding**
```bash
# Check health check configuration
aws ecs describe-task-definition \
  --task-definition bitwise-gateway-td \
  --output json | jq '.taskDefinition.containerDefinitions[0].healthCheck'
```

---

## Scaling & Performance Tuning

### Auto-scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/${PROJECT_NAME}-${ENV_NAME}/gateway-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name gateway-scaling-policy \
  --policy-type TargetTrackingScaling \
  --service-namespace ecs \
  --resource-id service/${PROJECT_NAME}-${ENV_NAME}/gateway-service \
  --scalable-dimension ecs:service:DesiredCount \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }'
```

### Resource Optimization

- Adjust CPU and memory in task definitions based on load
- Use spot instances for non-critical workloads (cost optimization)
- Implement connection pooling in services
- Use CloudFront for frontend CDN

---

## Cost Optimization Tips

1. **Use Fargate Spot** for development/testing (70% cost savings)
2. **Right-size resources** - Start small, scale based on metrics
3. **Use RDS Reserved Instances** for databases
4. **Enable auto-scaling** to reduce running tasks during off-peak hours
5. **Use CloudWatch cost anomaly detection**

---

## Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/best_practices.html)
- [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [ECR Best Practices](https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_best_practices.html)
- [CloudWatch Logs Insights Queries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)

---

## Support & Troubleshooting

For issues or questions, refer to:
1. AWS CloudWatch Logs
2. ECS Console Events
3. Docker build logs
4. ECR scan results for security vulnerabilities
