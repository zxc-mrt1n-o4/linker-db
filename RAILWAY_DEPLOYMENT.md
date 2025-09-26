# Railway Deployment Guide - Linker Database API

## Overview
This is the database API server for the Linker Platform. It provides RESTful endpoints for user management, chat messages, issues, and proxy links.

## Environment Variables Required

Set these environment variables in your Railway project settings:

### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string (Railway provides this automatically)
- `JWT_SECRET` - A secure random string for JWT token signing
- `NODE_ENV` - Set to "production"

### Optional Variables:
- `PORT` - Railway sets this automatically, but you can override if needed
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (defaults to linker.up.railway.app)

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**: Add the required environment variables in Railway dashboard
3. **Deploy**: Railway will automatically build and deploy your application

## Database Setup

Railway will automatically provide a PostgreSQL database. The Prisma schema will be applied automatically during deployment.

## Build Process

Railway will:
1. Install dependencies (`npm ci`)
2. Generate Prisma client (`prisma generate`)
3. Start the server (`npm start`)

## Health Check

The application includes a health check endpoint at `/api/health` that Railway will use to verify the deployment.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user (admin only)

### Chat Messages
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Create new message

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue status

### Proxy Links
- `GET /api/proxies` - Get active proxy links
- `POST /api/proxies` - Create new proxy link (admin only)
- `PUT /api/proxies/:id` - Update proxy link (admin only)

### Admin
- `GET /api/admin/stats` - Get platform statistics (admin only)

## Integration

This database API is designed to be used by the Linker Platform frontend at `https://linker.up.railway.app/`. The frontend will make API calls to this database server.

## Support

For deployment issues or questions, check the Railway logs in your project dashboard.
