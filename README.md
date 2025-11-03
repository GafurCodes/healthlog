# Nibble

A full-stack health and wellness tracking application built with TypeScript, featuring meal logging, workout tracking, and sleep monitoring.

## 🏗️ Project Structure

This is a monorepo containing two main applications:

```
healthlog/
├── apps/
│   ├── api/          # Backend API (Express + TypeScript + MongoDB)
│   └── web/          # Frontend Web App (React + TypeScript + Vite)
├── docker-compose.yml
└── README.md
```

## 📦 Technology Stack

### Backend (`apps/api/`)
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens)
- **Email**: Nodemailer / SendGrid
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate limiting

### Frontend (`apps/web/`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Styling**: CSS Modules
- **Deployment**: Nginx (Docker)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/GafurCodes/healthlog.git
   cd healthlog
   ```

2. **Configure environment variables**
   - Backend: `apps/api/.env` (see configuration section below)
   - Frontend: `apps/web/.env` (optional, has defaults)

3. **Start all services**
   ```bash
   docker compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - API: http://localhost:4000
   - API Health: http://localhost:4000/api/health
   - MongoDB: localhost:27017

### Running Locally (Development)

#### Backend API
```bash
cd apps/api
npm install
npm run dev          # Start dev server with hot reload
npm test            # Run tests
npm run build       # Build for production
```

#### Frontend Web
```bash
cd apps/web
npm install
npm run dev         # Start Vite dev server (http://localhost:5173)
npm run build       # Build for production
npm run preview     # Preview production build
```

## 🗂️ Backend API Structure

```
apps/api/src/
├── app.ts              # Express app factory (CORS, middleware, routes)
├── server.ts           # Server startup and graceful shutdown
├── config/             # Configuration files
│   ├── env.ts          # Environment validation (Zod)
│   └── rateLimiter.ts  # Rate limiting config
├── controllers/        # Request handlers
│   ├── auth.controller.ts
│   └── log.controller.ts
├── services/           # Business logic
│   ├── auth.service.ts
│   ├── email.service.ts
│   └── log.service.ts
├── models/             # MongoDB schemas
│   ├── User.ts
│   └── Log.ts
├── routes/             # API routes
│   ├── auth.routes.ts  # POST /api/auth/*
│   └── log.routes.ts   # CRUD /api/logs/*
├── middleware/         # Custom middleware
│   ├── auth.ts         # JWT verification
│   └── error.ts        # Error handling
├── utils/              # Utilities
│   ├── jwt.ts          # JWT creation/verification
│   ├── tokens.ts       # Refresh token management
│   └── validation.ts   # Zod schemas
└── test/               # Unit tests
    └── setup.ts        # Jest + mongodb-memory-server
```

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

#### Logs (Protected Routes)
- `GET /api/logs` - List logs (with filters: type, date range, pagination)
- `POST /api/logs` - Create new log
- `GET /api/logs/:id` - Get specific log
- `PUT /api/logs/:id` - Update log
- `DELETE /api/logs/:id` - Delete log

### Log Types & Structure

All logs follow this structure:
```typescript
{
  type: 'meal' | 'workout' | 'sleep',
  metrics: { /* type-specific fields */ },
  date: string,  // ISO datetime
  notes?: string
}
```

**Meal Log**:
```json
{
  "type": "meal",
  "metrics": {
    "name": "Breakfast",
    "calories": 500,
    "protein": 20,
    "carbs": 60,
    "fat": 15
  },
  "date": "2025-11-01T10:00:00.000Z",
  "notes": "Morning meal"
}
```

**Workout Log**:
```json
{
  "type": "workout",
  "metrics": {
    "name": "Morning Run",
    "duration": 30,
    "workoutType": "cardio",
    "intensity": "moderate",
    "caloriesBurned": 300
  },
  "date": "2025-11-01T07:00:00.000Z"
}
```

**Sleep Log**:
```json
{
  "type": "sleep",
  "metrics": {
    "duration": 7.5,
    "quality": "good"
  },
  "date": "2025-11-01T23:00:00.000Z"
}
```

## 🎨 Frontend Structure

```
apps/web/src/
├── main.tsx            # App entry point
├── App.tsx             # Root component with routing
├── api/                # API client layer
│   ├── client.ts       # Axios instance with auth interceptor
│   ├── auth.ts         # Auth API calls
│   └── logs.ts         # Logs API calls
├── components/         # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ErrorBoundary.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx      # User authentication state
│   └── ThemeContext.tsx     # Theme (light/dark mode)
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx    # Charts and analytics
│   ├── LogsPage.tsx         # List all logs
│   ├── LogFormPage.tsx      # Create/edit logs
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── VerifyEmailPage.tsx
│   └── NotFoundPage.tsx
├── types/              # TypeScript interfaces
│   └── index.ts        # User, Log, API types
└── styles/             # CSS modules
    └── components.module.css
```

### Frontend Routing

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password (with token)
- `/verify-email` - Email verification (with token)
- `/dashboard` - Dashboard with analytics (protected)
- `/logs` - List all logs (protected)
- `/logs/new` - Create new log (protected)
- `/logs/:id/edit` - Edit existing log (protected)

## ⚙️ Configuration

### Backend Environment Variables (`apps/api/.env`)

```bash
# Server
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://mongo:healthlog_password@mongodb:27017/healthlog?authSource=admin

# JWT Secrets (Min 32 characters)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=http://localhost,http://localhost:5173

# Email Service
EMAIL_FROM=noreply@healthlog.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application URLs
APP_BASE_URL=http://localhost
API_BASE_URL=http://localhost:4000/api
```

### Frontend Environment Variables (`apps/web/.env`)

```bash
# API Base URL (used at build time)
VITE_API_BASE_URL=http://localhost:4000/api
```

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npx jest <file>            # Run specific test
npx jest -t "test name"    # Run by pattern
```

Tests use:
- Jest test framework
- mongodb-memory-server (in-memory MongoDB)
- Supertest (HTTP assertions)

Test files are located in `apps/api/src/test/` and follow the pattern `*.test.ts`.

## 🐳 Docker Services

The `docker-compose.yml` defines three services:

### 1. MongoDB (`mongodb`)
- **Image**: mongo:latest
- **Port**: 27017
- **Credentials**: mongo / healthlog_password
- **Database**: healthlog
- **Volumes**: mongodb_data, mongodb_config

### 2. API (`api`)
- **Build**: ./apps/api
- **Port**: 4000
- **Depends**: MongoDB (with health check)
- **Environment**: From apps/api/.env

### 3. Frontend (`frontend`)
- **Build**: ./apps/web
- **Port**: 80 (nginx)
- **Depends**: API
- **Serves**: Static files from Vite build

### Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
docker logs healthlog-api
docker logs healthlog-web

# Rebuild specific service
docker compose up --build api -d
docker compose up --build frontend -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 🔒 Security Features

- **Password Requirements**: Min 8 chars, uppercase, lowercase, number
- **JWT Authentication**: Access tokens (15m) + Refresh tokens (7d)
- **Rate Limiting**: API endpoints protected against abuse
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based flow

## 🎯 Key Features

### User Management
- ✅ User registration with email verification
- ✅ Login with JWT authentication
- ✅ Password reset flow
- ✅ Protected routes with auth middleware

### Health Logging
- ✅ Track meals with macros (calories, protein, carbs, fat)
- ✅ Log workouts (type, duration, intensity, calories burned)
- ✅ Monitor sleep (duration, quality rating)
- ✅ Add notes to any log entry
- ✅ Date/time tracking for all entries

### Analytics & Visualization
- ✅ Dashboard with summary cards
- ✅ Charts for calorie trends
- ✅ Workout duration tracking
- ✅ Sleep hours visualization
- ✅ Filter by date range
- ✅ Filter by log type

### User Experience
- ✅ Responsive design
- ✅ Dark/light theme toggle
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Pagination for log lists

## 🛠️ Development Tips

### API Development
1. Use `createApp()` in `apps/api/src/app.ts` for testable changes
2. Add routes in `routes/`, controllers in `controllers/`, business logic in `services/`
3. Validate input with Zod schemas in `utils/validation.ts`
4. Write tests in `test/` directory
5. Run tests before committing: `npm test`

### Frontend Development
1. API calls go in `src/api/`
2. Reusable components in `src/components/`
3. Page components in `src/pages/`
4. Types in `src/types/`
5. Use `AuthContext` for authentication state
6. Use `ThemeContext` for theme management

### Common Issues

**CORS Errors**: Update `CORS_ORIGIN` in `apps/api/.env` to include your frontend URL

**API Connection Failed**: Ensure API container is running and accessible at `http://localhost:4000`

**MongoDB Connection**: Check MongoDB container is healthy: `docker compose ps`

**Email Not Sending**: Verify SMTP credentials in `apps/api/.env`

## 📝 Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  name: string,
  emailVerified: boolean,
  emailVerificationToken?: string,
  emailVerificationExpires?: Date,
  passwordResetToken?: string,
  passwordResetExpires?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Log Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  type: 'meal' | 'workout' | 'sleep' (indexed),
  metrics: Mixed (type-specific data),
  date: Date (indexed),
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
- `{ userId: 1, date: -1 }` - User logs by date
- `{ userId: 1, type: 1, date: -1 }` - Filtered user logs
- `{ date: 1 }` - Date queries


---

**Quick Links**:
- API Docs: See `apps/api/src/docs/openapi.yaml`
- Copilot Instructions: `.github/copilot-instructions.md`
- Implementation Plan: `CLAUDE_MVP_IMPLEMENTATION_PLAN.md`
