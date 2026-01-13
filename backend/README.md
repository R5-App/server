# Pet App Backend API

Backend API for the pet management mobile application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials and JWT secret.

4. Make sure your PostgreSQL database is running and the schema from `database.sql` is applied.

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register a new user
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth required**: No

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe",
      "createdAt": "2026-01-13T10:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters long"
  ]
}
```

**Error Response (409):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

## Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

## Username Requirements

- Minimum 3 characters
- Maximum 30 characters
- Can only contain letters, numbers, and underscores
- Must be unique

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Run in production mode:
```bash
npm start
```
