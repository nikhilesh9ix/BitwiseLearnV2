#!/bin/bash

###############################################################################
# BitwiseLearn AWS Build & Push Script
# This script builds and pushes all Docker images to AWS ECR
###############################################################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${GREEN}=== $1 ===${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Verify environment variables
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$AWS_REGION" ] || [ -z "$IMAGE_TAG" ]; then
    print_error "Required environment variables not set:"
    echo "  - AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
    echo "  - AWS_REGION: $AWS_REGION"
    echo "  - IMAGE_TAG: $IMAGE_TAG"
    exit 1
fi

# Get absolute path to repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

print_header "Starting AWS Build & Push Process"
echo "Repository Root: $REPO_ROOT"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "Image Tag: $IMAGE_TAG"

# Step 1: Authenticate Docker with ECR
print_header "Authenticating Docker with ECR"
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" || {
    print_error "Failed to authenticate with ECR"
    exit 1
}
print_success "Docker authentication successful"

# Step 2: Build Backend Services
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

FAILED_BUILDS=()

for SERVICE in "${SERVICES[@]}"; do
    print_header "Building bitwise-${SERVICE}"
    
    ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}"
    
    if docker build \
        -f "apps/${SERVICE}/Dockerfile" \
        -t "${ECR_URI}:${IMAGE_TAG}" \
        -t "${ECR_URI}:latest" \
        .; then
        print_success "Build successful for bitwise-${SERVICE}"
    else
        print_error "Build failed for bitwise-${SERVICE}"
        FAILED_BUILDS+=("$SERVICE")
    fi
done

# Step 3: Build Frontend
print_header "Building bitwise-frontend"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-frontend"
if docker build \
    -f "frontend/Dockerfile" \
    -t "${ECR_URI}:${IMAGE_TAG}" \
    -t "${ECR_URI}:latest" \
    frontend/; then
    print_success "Build successful for bitwise-frontend"
else
    print_error "Build failed for bitwise-frontend"
    FAILED_BUILDS+=("frontend")
fi

# Check for build failures
if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    print_error "Build failures detected for: ${FAILED_BUILDS[*]}"
    exit 1
fi

# Step 4: Push images to ECR
print_header "Pushing images to ECR"

SERVICES+=("frontend")
FAILED_PUSHES=()

for SERVICE in "${SERVICES[@]}"; do
    print_header "Pushing bitwise-${SERVICE} to ECR"
    
    ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}"
    
    if docker push "${ECR_URI}:${IMAGE_TAG}" && docker push "${ECR_URI}:latest"; then
        print_success "Push successful for bitwise-${SERVICE}"
    else
        print_error "Push failed for bitwise-${SERVICE}"
        FAILED_PUSHES+=("$SERVICE")
    fi
done

# Final status
echo ""
print_header "Build & Push Complete"

if [ ${#FAILED_PUSHES[@]} -eq 0 ]; then
    print_success "All images built and pushed successfully!"
    echo ""
    echo "ECR Repository URIs:"
    for SERVICE in "${SERVICES[@]}"; do
        echo "  - ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bitwise-${SERVICE}:${IMAGE_TAG}"
    done
else
    print_error "Some pushes failed: ${FAILED_PUSHES[*]}"
    echo "Please fix the errors and try again."
    exit 1
fi
