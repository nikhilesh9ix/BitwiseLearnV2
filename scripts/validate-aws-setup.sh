#!/bin/bash

###############################################################################
# BitwiseLearn AWS Deployment Validation Script
# Validates that all prerequisites and configurations are in place
###############################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

print_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

# ===== Environment Variables Check =====
print_header "Checking Environment Variables"

if [ -z "$AWS_ACCOUNT_ID" ]; then
    check_fail "AWS_ACCOUNT_ID not set"
else
    check_pass "AWS_ACCOUNT_ID is set ($AWS_ACCOUNT_ID)"
fi

if [ -z "$AWS_REGION" ]; then
    check_fail "AWS_REGION not set"
else
    check_pass "AWS_REGION is set ($AWS_REGION)"
fi

if [ -z "$IMAGE_TAG" ]; then
    check_warn "IMAGE_TAG not set (will use 'latest')"
    export IMAGE_TAG="latest"
else
    check_pass "IMAGE_TAG is set ($IMAGE_TAG)"
fi

# ===== AWS CLI Check =====
print_header "Checking AWS CLI"

if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    check_pass "AWS CLI is installed: $AWS_VERSION"
else
    check_fail "AWS CLI is not installed"
fi

# ===== AWS Credentials Check =====
print_header "Checking AWS Credentials"

if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    if [ "$ACCOUNT" = "$AWS_ACCOUNT_ID" ]; then
        check_pass "AWS credentials are valid and match AWS_ACCOUNT_ID"
    else
        check_warn "AWS credentials are valid but account ID differs (Configured: $AWS_ACCOUNT_ID, Actual: $ACCOUNT)"
    fi
else
    check_fail "AWS credentials are not configured or invalid"
fi

# ===== Docker Check =====
print_header "Checking Docker"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker is installed: $DOCKER_VERSION"
else
    check_fail "Docker is not installed"
fi

# ===== Docker Authentication =====
print_header "Checking Docker ECR Authentication"

if echo "" | docker run --rm -i alpine echo &> /dev/null; then
    check_pass "Docker daemon is running"
else
    check_fail "Docker daemon is not running"
fi

# ===== ECR Repositories Check =====
print_header "Checking ECR Repositories"

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
    REPO_NAME="bitwise-${SERVICE}"
    if aws ecr describe-repositories \
        --repository-names "$REPO_NAME" \
        --region "$AWS_REGION" &> /dev/null; then
        check_pass "ECR repository exists: $REPO_NAME"
    else
        check_warn "ECR repository does not exist: $REPO_NAME (create with: aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION)"
    fi
done

# ===== Dockerfiles Check =====
print_header "Checking Dockerfiles"

if [ -f "apps/gateway/Dockerfile" ]; then
    check_pass "Gateway Dockerfile exists"
else
    check_fail "Gateway Dockerfile not found"
fi

if [ -f "frontend/Dockerfile" ]; then
    check_pass "Frontend Dockerfile exists"
else
    check_fail "Frontend Dockerfile not found"
fi

for SERVICE in "${SERVICES[@]}"; do
    if [ -f "apps/${SERVICE}/Dockerfile" ]; then
        check_pass "${SERVICE} Dockerfile exists"
    else
        check_fail "${SERVICE} Dockerfile not found"
    fi
done

# ===== Environment Configuration Check =====
print_header "Checking Environment Configuration"

if [ -f ".env.prod" ]; then
    check_pass ".env.prod file exists"
else
    check_warn ".env.prod file not found (use .env.prod.example as template)"
fi

# ===== ECS Cluster Check =====
print_header "Checking ECS Resources"

CLUSTER_NAME="bitwise-production"

if aws ecs describe-clusters \
    --clusters "$CLUSTER_NAME" \
    --region "$AWS_REGION" \
    --query 'clusters[0].clusterArn' \
    --output text 2> /dev/null | grep -q "arn:aws"; then
    check_pass "ECS cluster exists: $CLUSTER_NAME"
else
    check_warn "ECS cluster does not exist: $CLUSTER_NAME"
fi

# ===== IAM Role Check =====
print_header "Checking IAM Roles"

if aws iam get-role \
    --role-name BitwiseECSTaskRole &> /dev/null; then
    check_pass "IAM role exists: BitwiseECSTaskRole"
else
    check_warn "IAM role does not exist: BitwiseECSTaskRole"
fi

# ===== CloudWatch Logs Check =====
print_header "Checking CloudWatch Log Groups"

for SERVICE in "${SERVICES[@]}"; do
    LOG_GROUP="/ecs/bitwise-${SERVICE}"
    if aws logs describe-log-groups \
        --log-group-name-prefix "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --query "logGroups[?logGroupName=='$LOG_GROUP'].logGroupName" \
        --output text 2> /dev/null | grep -q "bitwise"; then
        check_pass "CloudWatch log group exists: $LOG_GROUP"
    else
        check_warn "CloudWatch log group does not exist: $LOG_GROUP"
    fi
done

# ===== Configuration Files Check =====
print_header "Checking Configuration Files"

if [ -f "docker-compose.prod.yml" ]; then
    check_pass "docker-compose.prod.yml exists"
else
    check_fail "docker-compose.prod.yml not found"
fi

if [ -f "AWS_DEPLOYMENT.md" ]; then
    check_pass "AWS_DEPLOYMENT.md documentation exists"
else
    check_warn "AWS_DEPLOYMENT.md documentation not found"
fi

# ===== Security Check =====
print_header "Checking Security"

if grep -q "DEBUG=false" .env.prod 2>/dev/null; then
    check_pass "DEBUG is disabled in .env.prod"
else
    check_warn "DEBUG setting not verified in .env.prod"
fi

if grep -q "JWT_SECRET" .env.prod 2>/dev/null; then
    check_pass ".env.prod contains JWT_SECRET"
else
    check_warn ".env.prod does not contain JWT_SECRET"
fi

# ===== Final Summary =====
print_header "Validation Summary"

echo ""
echo -e "${GREEN}Passed:${NC} $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
echo -e "${RED}Failed:${NC} $CHECKS_FAILED"

echo ""
echo "Recommended Next Steps:"
echo "1. Ensure all failed checks are resolved"
echo "2. Address warnings according to your requirements"
echo "3. Run: export AWS_ACCOUNT_ID=... AWS_REGION=... IMAGE_TAG=v1.0.0"
echo "4. Run: ./scripts/aws-build-push.sh"
echo "5. Follow AWS_DEPLOYMENT.md for service deployment"

if [ $CHECKS_FAILED -gt 0 ]; then
    exit 1
fi

exit 0
