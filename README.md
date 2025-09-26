# Linker Database API Server

A dedicated database API server for the Linker Platform, providing RESTful endpoints for user management, chat messages, issues, and proxy links.

## Features

- **User Management**: Registration, authentication, and user administration
- **Chat System**: Real-time messaging with message history
- **Issue Tracking**: Create and manage support issues
- **Proxy Links**: Manage proxy links and third-party services
- **Admin Dashboard**: Statistics and administrative functions
- **JWT Authentication**: Secure token-based authentication
- **CORS Support**: Configurable cross-origin resource sharing

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

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

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database
npm run db:seed

# Start development server
npm run dev
```

## Deployment

This application is designed to be deployed on Railway. See `RAILWAY_DEPLOYMENT.md` for detailed deployment instructions.

## Database Schema

The database includes the following models:
- **User** - User accounts with roles and status
- **ChatMessage** - Chat messages with user relationships
- **Issue** - Support issues with priority and status
- **ProxyLink** - Proxy links with type and status

## Security

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation
- SQL injection protection via Prisma

## License

MIT License
