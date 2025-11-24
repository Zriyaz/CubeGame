# AWS Deployment Guide

This guide covers the easiest ways to deploy your CubeGame application to AWS.

## 🎯 Recommended Approach: AWS App Runner (Easiest)

**Why App Runner?**
- ✅ Fully managed container service
- ✅ Automatic scaling
- ✅ Built-in load balancing
- ✅ No infrastructure management
- ✅ Pay only for what you use
- ✅ Works with Docker Compose setup

## 📋 Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. Docker installed locally
4. AWS ECR (Elastic Container Registry) access

## 🚀 Deployment Options

### Option 1: AWS App Runner (Recommended - Easiest)

**Best for:** Quick deployment with minimal configuration

#### Steps:

1. **Push Docker images to ECR**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Create ECR repositories
   aws ecr create-repository --repository-name cubegame-backend --region us-east-1
   aws ecr create-repository --repository-name cubegame-frontend --region us-east-1

   # Build and push backend
   docker build -f docker/Dockerfile.backend.dev -t cubegame-backend .
   docker tag cubegame-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cubegame-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cubegame-backend:latest

   # Build and push frontend
   docker build -f docker/Dockerfile.frontend.dev -t cubegame-frontend .
   docker tag cubegame-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cubegame-frontend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cubegame-frontend:latest
   ```

2. **Create RDS PostgreSQL Database**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier cubegame-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username postgres \
     --master-user-password <your-password> \
     --allocated-storage 20 \
     --vpc-security-group-ids <security-group-id> \
     --db-name socket_game
   ```

3. **Create ElastiCache Redis**
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id cubegame-redis \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1 \
     --security-group-ids <security-group-id>
   ```

4. **Deploy via AWS Console**
   - Go to AWS App Runner console
   - Create service → Container registry → ECR
   - Select your backend image
   - Configure environment variables
   - Deploy

---

### Option 2: AWS ECS Fargate (More Control)

**Best for:** Production workloads with more control

#### Steps:

1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name cubegame-cluster
   ```

2. **Create Task Definitions** (see `aws/ecs-task-definition.json`)

3. **Create Services** via AWS Console or CLI

---

### Option 3: AWS Lightsail Containers (Simplest Overall)

**Best for:** Small to medium applications, easiest setup

#### Steps:

1. Go to AWS Lightsail → Containers
2. Create container service
3. Upload Docker images
4. Configure environment variables
5. Deploy

**Pros:**
- ✅ Fixed pricing
- ✅ Very simple UI
- ✅ No complex configuration

---

### Option 4: AWS Amplify + EC2/ECS

**Best for:** Separate frontend/backend deployment

#### Frontend (Amplify):
1. Connect GitHub repository
2. Build settings: `npm run build`
3. Deploy automatically

#### Backend (EC2 or ECS):
- Deploy backend separately
- Update frontend API URLs

---

## 🗄️ Database Setup

### RDS PostgreSQL

1. **Create Database Instance**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (free tier eligible)
   - Storage: 20 GB
   - Master username/password

2. **Get Connection String**
   ```
   postgresql://postgres:password@cubegame-db.xxxxx.us-east-1.rds.amazonaws.com:5432/socket_game
   ```

3. **Run Migrations**
   ```bash
   # SSH into backend container or use AWS Systems Manager
   npm run db:migrate
   ```

### ElastiCache Redis

1. **Create Redis Cluster**
   - Node type: cache.t3.micro
   - Engine: Redis 7
   - Get endpoint URL

---

## 🔐 Environment Variables

Create these in your AWS service (App Runner/ECS/Lightsail):

```env
# Database
DATABASE_URL=postgresql://postgres:password@cubegame-db.xxxxx.us-east-1.rds.amazonaws.com:5432/socket_game

# Redis
REDIS_URL=redis://cubegame-redis.xxxxx.cache.amazonaws.com:6379

# JWT Secrets (generate new ones for production!)
JWT_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
SESSION_SECRET=<generate-secure-random-string>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback

# URLs
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_PORT=5000
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

---

## 📝 Step-by-Step: AWS App Runner Deployment

### 1. Prepare Production Dockerfiles

Create production Dockerfiles (see `docker/Dockerfile.backend.prod` and `docker/Dockerfile.frontend.prod`)

### 2. Build and Push Images

```bash
# Set variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_BASE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_BASE

# Create repositories
aws ecr create-repository --repository-name cubegame-backend --region $AWS_REGION || true
aws ecr create-repository --repository-name cubegame-frontend --region $AWS_REGION || true

# Build backend
docker build -f docker/Dockerfile.backend.prod -t cubegame-backend:latest .
docker tag cubegame-backend:latest $ECR_BASE/cubegame-backend:latest
docker push $ECR_BASE/cubegame-backend:latest

# Build frontend
docker build -f docker/Dockerfile.frontend.prod -t cubegame-frontend:latest .
docker tag cubegame-frontend:latest $ECR_BASE/cubegame-frontend:latest
docker push $ECR_BASE/cubegame-frontend:latest
```

### 3. Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier cubegame-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name socket_game \
  --backup-retention-period 7 \
  --region us-east-1
```

### 4. Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id cubegame-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx \
  --region us-east-1
```

### 5. Deploy Backend via App Runner

1. Go to AWS Console → App Runner → Create service
2. Source: Container registry → ECR
3. Select: `cubegame-backend:latest`
4. Service name: `cubegame-backend`
5. Port: `5000`
6. Environment variables: Add all from `.env`
7. Create & Deploy

### 6. Deploy Frontend via App Runner

1. Create another App Runner service
2. Select: `cubegame-frontend:latest`
3. Port: `5173`
4. Environment variables:
   ```
   VITE_API_URL=https://your-backend-url.amazonaws.com
   VITE_WS_URL=wss://your-backend-url.amazonaws.com
   ```
5. Create & Deploy

### 7. Update Google OAuth Settings

1. Go to Google Cloud Console
2. Update OAuth credentials:
   - Authorized JavaScript origins: `https://your-frontend-url.amazonaws.com`
   - Authorized redirect URIs: `https://your-backend-url.amazonaws.com/api/auth/google/callback`

### 8. Run Database Migrations

```bash
# Connect to backend container or use AWS Systems Manager
aws apprunner start-deployment --service-arn <backend-service-arn>

# Or use AWS Systems Manager Session Manager
aws ssm start-session --target <container-instance-id>
npm run db:migrate
```

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | \
            docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
      
      - name: Build and push backend
        run: |
          docker build -f docker/Dockerfile.backend.prod -t cubegame-backend .
          docker tag cubegame-backend:latest ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/cubegame-backend:latest
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/cubegame-backend:latest
      
      - name: Deploy to App Runner
        run: |
          aws apprunner start-deployment --service-arn ${{ secrets.BACKEND_SERVICE_ARN }}
```

---

## 💰 Cost Estimation

### AWS App Runner:
- Backend: ~$0.007/hour = ~$5/month (minimal traffic)
- Frontend: ~$0.007/hour = ~$5/month
- **Total: ~$10/month**

### RDS PostgreSQL (db.t3.micro):
- Free tier eligible (first 12 months)
- After: ~$15/month

### ElastiCache Redis (cache.t3.micro):
- ~$12/month

### **Total Estimated Cost: ~$37/month** (after free tier)

---

## 🎯 Quick Start Checklist

- [ ] Create AWS account
- [ ] Install AWS CLI
- [ ] Create ECR repositories
- [ ] Build and push Docker images
- [ ] Create RDS PostgreSQL database
- [ ] Create ElastiCache Redis cluster
- [ ] Deploy backend to App Runner
- [ ] Deploy frontend to App Runner
- [ ] Update Google OAuth settings
- [ ] Run database migrations
- [ ] Test deployment
- [ ] Set up custom domains (optional)
- [ ] Configure SSL certificates (automatic with App Runner)

---

## 📚 Additional Resources

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)

---

## 🆘 Troubleshooting

### Common Issues:

1. **Connection refused to database**
   - Check security groups allow inbound traffic
   - Verify database endpoint URL

2. **Environment variables not working**
   - Ensure variables are set in App Runner service settings
   - Restart service after adding variables

3. **CORS errors**
   - Update `FRONTEND_URL` in backend environment
   - Check CORS middleware configuration

4. **WebSocket connection fails**
   - Ensure WebSocket protocol (wss://) is used
   - Check App Runner supports WebSockets (it does!)

---

## 🚀 Next Steps

1. Choose your deployment method (App Runner recommended)
2. Follow the step-by-step guide
3. Test thoroughly
4. Monitor costs and performance
5. Set up alerts and monitoring

Need help? Check the troubleshooting section or AWS documentation!

