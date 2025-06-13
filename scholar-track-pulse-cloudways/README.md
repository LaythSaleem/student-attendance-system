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
