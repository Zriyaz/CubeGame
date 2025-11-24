#!/bin/bash

# AWS Deployment Script
# This script helps deploy CubeGame to AWS App Runner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
ECR_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}🚀 AWS Deployment Script for CubeGame${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}\n"

# Login to ECR
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_BASE
echo -e "${GREEN}✅ Logged into ECR${NC}\n"

# Create ECR repositories if they don't exist
echo -e "${YELLOW}Creating ECR repositories...${NC}"
aws ecr create-repository --repository-name cubegame-backend --region $AWS_REGION 2>/dev/null || echo "Backend repository already exists"
aws ecr create-repository --repository-name cubegame-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend repository already exists"
echo -e "${GREEN}✅ ECR repositories ready${NC}\n"

# Build and push backend
echo -e "${YELLOW}Building backend image...${NC}"
docker build -f docker/Dockerfile.backend.prod -t cubegame-backend:latest .
docker tag cubegame-backend:latest $ECR_BASE/cubegame-backend:latest
echo -e "${YELLOW}Pushing backend image...${NC}"
docker push $ECR_BASE/cubegame-backend:latest
echo -e "${GREEN}✅ Backend image pushed${NC}\n"

# Build and push frontend
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -f docker/Dockerfile.frontend.prod -t cubegame-frontend:latest .
docker tag cubegame-frontend:latest $ECR_BASE/cubegame-frontend:latest
echo -e "${YELLOW}Pushing frontend image...${NC}"
docker push $ECR_BASE/cubegame-frontend:latest
echo -e "${GREEN}✅ Frontend image pushed${NC}\n"

echo -e "${GREEN}🎉 Images pushed successfully!${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to AWS App Runner console"
echo "2. Create service for backend: $ECR_BASE/cubegame-backend:latest"
echo "3. Create service for frontend: $ECR_BASE/cubegame-frontend:latest"
echo "4. Configure environment variables"
echo "5. Deploy!"
echo ""
echo "Backend image: $ECR_BASE/cubegame-backend:latest"
echo "Frontend image: $ECR_BASE/cubegame-frontend:latest"

