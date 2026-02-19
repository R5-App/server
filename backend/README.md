# Pet App Backend API

Backend API for the pet management mobile application. This REST API provides comprehensive pet management features including pet profiles, health records, medications, vaccinations, vet visits, weight tracking, route tracking, and calendar events.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-User Support**: Sub-users with different permission levels
- **Pet Management**: Complete pet profiles with sharing capabilities
- **Health Records**: Track medications, vaccinations, and vet visits
- **Weight Tracking**: Monitor pet weight over time
- **Route Tracking**: GPS-based route tracking for walks
- **Calendar Events**: Schedule and manage pet-related events
- **Avatar Management**: Upload and manage pet and user profile images
- **Security**: Rate limiting, CORS, Helmet, and secure password hashing

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: validator

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/petapp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### 3. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
createdb petapp
```

Apply the database schema:

```bash
psql -U your_username -d petapp -f ../database.sql
```

### 4. Start the Server

**Development mode** (with hot-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in `.env`).

### 5. Docker Setup (Optional)

For testing with Docker Compose:

```bash
docker-compose -f docker-compose.ci.yml up
```

This will start both PostgreSQL and the API server.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check

#### GET /health
Check API health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T10:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/auth/login
Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### POST /api/auth/logout
Logout current user (requires authentication)

### PUT /api/auth/email
Update user email address (requires authentication)

### PUT /api/auth/password
Update user password (requires authentication)

### DELETE /api/auth/account/:userId
Delete user account (requires authentication)

### GET /api/auth/sub-users
Get all sub-users linked to the authenticated user's account

### DELETE /api/auth/sub-user/:subUserId
Remove a sub-user linking

### PUT /api/auth/sub-user/:subUserId/pet/:petId/role
Update sub-user role for a specific pet

---

## Pet Endpoints

### GET /api/pets
Get all pets for the authenticated user

### POST /api/pets
Create a new pet profile

### GET /api/pets/:petId
Get pet details by ID

### GET /api/pets/:petId/complete
Get complete pet data including all medications, vaccinations, weights, and vet visits

### PUT /api/pets/:petId
Update pet details

### DELETE /api/pets/:petId
Delete a pet profile

### POST /api/pets/:petId/share
Generate a temporary share code for pet access

### POST /api/pets/redeem
Redeem a share code to gain access to a pet

### GET /api/pets/:petId/shared-users
Get all users who have access to a pet

### DELETE /api/pets/:petId/shared-users/:sharedUserId
Remove a user's access to a pet

---

## Medication Endpoints

### GET /api/medications
Get all medications for the user's pets

### POST /api/medications
Add a new medication record

### PUT /api/medications/:id
Update medication record

### DELETE /api/medications/:id
Delete medication record

---

## Vaccination Endpoints

### GET /api/vaccinations
Get all vaccinations for the user's pets

### POST /api/vaccinations
Add a new vaccination record

### PUT /api/vaccinations/:id
Update vaccination record

### DELETE /api/vaccinations/:id
Delete vaccination record

---

## Vet Visit Endpoints

### GET /api/vet-visits/types
Get all available vet visit types

### GET /api/vet-visits
Get all vet visits for the user's pets

### POST /api/vet-visits
Add a new vet visit record

### PUT /api/vet-visits/:id
Update vet visit record

### DELETE /api/vet-visits/:id
Delete vet visit record

---

## Weight Endpoints

### GET /api/weights
Get all weight records for the user's pets

### POST /api/weights
Add a new weight record

### PUT /api/weights/:id
Update weight record

### DELETE /api/weights/:id
Delete weight record

---

## Route Endpoints

### GET /api/routes
Get all routes for the authenticated user

### POST /api/routes
Create a new route with GPS coordinates

### GET /api/routes/:id
Get a specific route by ID with all coordinates

### GET /api/routes/pet/:petId
Get all routes for a specific pet

### DELETE /api/routes/:id
Delete a route

---

## Calendar Event Endpoints

### GET /api/calendar-events
Get all calendar events for the user's pets

### GET /api/calendar-events/pet/:petId
Get calendar events for a specific pet

### GET /api/calendar-events/:eventId
Get a single calendar event by ID

### POST /api/calendar-events
Create a new calendar event

### PUT /api/calendar-events/:eventId
Update a calendar event

### DELETE /api/calendar-events/:eventId
Delete a calendar event

---

## Avatar Endpoints

### GET /api/avatars/user/current
Get current avatar for authenticated user

### GET /api/avatars/pet/:petId
Get current avatar for a specific pet

### GET /api/avatars/:id
Get avatar by ID

### GET /api/avatars/:id/download
Download avatar file

### POST /api/avatars
Upload a new avatar (replaces existing)

### DELETE /api/avatars/:id
Delete an avatar

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Validation Rules

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

### Username Requirements
- Minimum 3 characters
- Maximum 30 characters
- Can only contain letters, numbers, and underscores
- Must be unique

## Security Features

- **Rate Limiting**: 300 requests per 15 minutes for general endpoints, 100 for authentication
- **CORS**: Configurable allowed origins via environment variables
- **Helmet**: Security headers protection
- **JWT**: Secure token-based authentication
- **bcrypt**: Password hashing with salt rounds
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries via pg library

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Optional array of validation errors"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (e.g., duplicate email)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # Type definitions
│   └── utils/           # Helper functions
├── uploads/
│   └── avatars/         # Avatar image storage
├── .env.example         # Environment variables template
├── docker-compose.ci.yml # Docker configuration
├── Dockerfile           # Docker image definition
└── package.json         # Dependencies and scripts

```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

Ensure Docker is running and execute:

```bash
docker-compose -f docker-compose.ci.yml up
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See LICENSE file in the root directory.

## Support

For issues and questions, please open an issue in the repository.
```bash
npm run dev
```

Run in production mode:
```bash
npm start
```
