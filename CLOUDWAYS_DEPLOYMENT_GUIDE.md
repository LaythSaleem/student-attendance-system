# 🚀 Scholar Track Pulse - Cloudways Deployment Guide

## Pre-Deployment Checklist

✅ Frontend built successfully  
✅ Production server created  
✅ Environment configuration ready  
✅ Deployment package prepared  

## 📦 Deployment Package Contents

Your Cloudways deployment package includes:

```
scholar-track-pulse-cloudways/
├── dist/                          # Frontend build files
│   ├── index.html
│   └── assets/
├── production-server.js           # Production Node.js server
├── package.json                   # Production dependencies
├── database.sqlite                # SQLite database (if exists)
├── .env                          # Environment configuration
├── uploads/                       # File upload directory
├── logs/                         # Application logs directory
└── README.md                     # Setup instructions
```

## 🔧 Cloudways Setup Instructions

### Step 1: Create Application

1. **Login to Cloudways Dashboard**
2. **Launch New Application**:
   - Cloud Provider: DigitalOcean (recommended)
   - Server Size: 1GB RAM minimum
   - Application: Node.js
   - App Name: `scholar-track-pulse`
   - Server Name: `school-attendance-server`

### Step 2: Configure Application

1. **Application Settings**:
   - Node.js Version: **18.x or higher**
   - Startup File: `production-server.js`
   - Port: `8888`

2. **Environment Variables** (Add in Application Settings):
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-2025
PORT=8888
CORS_ORIGIN=https://your-domain.cloudwaysapps.com
```

### Step 3: Deploy Files

**Option A: File Manager (Recommended)**
1. Go to **File Manager** in Cloudways
2. Navigate to `public_html` directory
3. Upload `scholar-track-pulse-cloudways.zip`
4. Extract all files in `public_html`

**Option B: Git Deployment**
1. Push your code to GitHub/GitLab
2. Use Cloudways Git Deployment feature
3. Connect repository and deploy

### Step 4: Install Dependencies

1. **Enable SSH** in Cloudways Application Settings
2. **Connect via SSH**:
```bash
ssh master@your-server-ip
cd applications/scholar-track-pulse/public_html
npm install --production
```

### Step 5: Database Setup

```bash
# Initialize database (if not exists)
npm run init-db

# Set proper permissions
chmod 666 database.sqlite
chmod 755 .
```

### Step 6: Start Application

```bash
# Test the application
npm start

# Application should start on port 8888
```

## 🌐 Access Your Application

- **Main URL**: `https://your-domain.cloudwaysapps.com`
- **Health Check**: `https://your-domain.cloudwaysapps.com/api/health`
- **Admin Panel**: Login with admin credentials

## 🔐 Default Credentials

- **Admin**: admin@school.com / admin123
- **Teacher**: teacher@school.com / teacher123

## 📊 Monitoring & Logs

### Application Logs
```bash
# SSH into server
cd applications/scholar-track-pulse/public_html
tail -f logs/app.log

# Or use Cloudways Log Viewer
```

### Health Monitoring
Visit `/api/health` endpoint to check:
- Server status
- Database connection
- Uptime information
- User count

## 🔧 Troubleshooting

### Common Issues

1. **Application Not Starting**
   - Check Node.js version (must be 18+)
   - Verify startup file is set to `production-server.js`
   - Check SSH logs: `tail -f logs/access.log`

2. **Database Errors**
   ```bash
   chmod 666 database.sqlite
   chmod 755 $(dirname database.sqlite)
   ```

3. **File Upload Issues**
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

4. **SSL Certificate**
   - Enable Let's Encrypt SSL in Cloudways
   - Force HTTPS redirect

### Performance Optimization

1. **Server Resources**
   - Minimum: 1GB RAM
   - Recommended: 2GB RAM for production

2. **Database Optimization**
   ```bash
   # Enable WAL mode (already configured)
   # Regular backup recommended
   ```

## 🚀 Going Live

### Final Steps

1. **Domain Setup**: Point your domain to Cloudways server
2. **SSL Certificate**: Enable and force HTTPS
3. **Environment Variables**: Update CORS_ORIGIN with your domain
4. **Security**: Change default passwords
5. **Backup**: Setup automated backups in Cloudways

### Security Checklist

- [ ] Change default admin password
- [ ] Change JWT secret in production
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Setup regular database backups
- [ ] Enable Cloudways security features

## 📞 Support

If you encounter issues:

1. Check Cloudways application logs
2. Verify all environment variables
3. Test health endpoint
4. Check database permissions
5. Review server resources

Your Scholar Track Pulse application is now ready for production use on Cloudways! 🎉
