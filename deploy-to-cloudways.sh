#!/bin/bash

# Scholar Track Pulse - Cloudways Deployment Script
# This script prepares the application for Cloudways deployment

echo "🚀 Preparing Scholar Track Pulse for Cloudways deployment..."

# Create deployment directory
DEPLOY_DIR="scholar-track-pulse-cloudways"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "📁 Creating deployment package..."

# Copy production files
cp -r dist/ $DEPLOY_DIR/
cp production-server.js $DEPLOY_DIR/
cp package-production.json $DEPLOY_DIR/package.json
cp database.sqlite $DEPLOY_DIR/ 2>/dev/null || echo "⚠️  Database file not found - will be created on first run"
cp .env.production $DEPLOY_DIR/.env

# Copy essential files
mkdir -p $DEPLOY_DIR/uploads
echo "Uploads directory for file storage" > $DEPLOY_DIR/uploads/.gitkeep

# Create logs directory
mkdir -p $DEPLOY_DIR/logs
echo "Logs directory" > $DEPLOY_DIR/logs/.gitkeep

# Create deployment README
cat > $DEPLOY_DIR/README.md << 'EOF'
# Scholar Track Pulse - Cloudways Deployment

## Quick Start

1. Upload all files to your Cloudways application directory
2. Set Node.js version to 18+ in Cloudways settings
3. Set startup file to: `production-server.js`
4. Install dependencies: `npm install --production`
5. Initialize database: `npm run init-db`
6. Start application: `npm start`

## Environment Variables

Configure these in Cloudways Application Settings:

- NODE_ENV=production
- JWT_SECRET=your-secure-secret-key
- PORT=8888

## Default Credentials

- Admin: admin@school.com / admin123
- Teacher: teacher@school.com / teacher123

## Health Check

Visit: https://your-domain.cloudwaysapps.com/api/health

## Support

For issues, check the logs in the Cloudways dashboard.
EOF

# Create .htaccess for Apache (if needed)
cat > $DEPLOY_DIR/.htaccess << 'EOF'
RewriteEngine On
RewriteRule ^(?!api).*$ /index.html [L]
EOF

# Create deployment info
cat > $DEPLOY_DIR/deployment-info.json << EOF
{
  "app_name": "Scholar Track Pulse",
  "version": "1.0.0",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployment_target": "Cloudways",
  "node_version_required": ">=18.0.0",
  "startup_file": "production-server.js",
  "health_check": "/api/health"
}
EOF

# Create archive for upload
cd $DEPLOY_DIR
zip -r ../scholar-track-pulse-cloudways.zip . -x "*.DS_Store" "*.git*"
cd ..

echo "✅ Deployment package created successfully!"
echo ""
echo "📦 Files created:"
echo "  - $DEPLOY_DIR/ (deployment folder)"
echo "  - scholar-track-pulse-cloudways.zip (upload this to Cloudways)"
echo ""
echo "📋 Next steps:"
echo "  1. Upload scholar-track-pulse-cloudways.zip to Cloudways"
echo "  2. Extract files in public_html directory"
echo "  3. Set Node.js version to 18+ in Cloudways"
echo "  4. Set startup file to: production-server.js"
echo "  5. Install dependencies: npm install --production"
echo "  6. Start the application"
echo ""
echo "🌐 Your app will be available at: https://your-domain.cloudwaysapps.com"
