# Resolv Backend API

The core backend service for Resolv, powering authentication, complaint management workflows, transactional email notifications, and an AI adapter layer.

## Architecture

* Runtime: Node.js and Express
* Database: PostgreSQL with Prisma ORM
* AI Engine: Decoupled client supporting Groq Cloud LPU inference and local Ollama or vLLM deployments
* Notifications: Resend transactional email API
* File Storage: Multer with timestamped random hash sanitization
* Security: Parameterized SQL execution guardrails, scoped CORS, and JWT authentication

## AI Capabilities

1. Automated Categorization and Priority: Tags incoming complaints based on semantic content.
2. Image Inspection: Validates uploaded photos for issue relevance before submission.
3. Duplicate Detection: Checks new complaints against existing records to flag duplicates.
4. Suggested Admin Responses: Recommends contextual resolution messages for administrators.
5. Text-to-SQL (Query AI): Converts natural language operations queries into safe PostgreSQL read queries.

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Set the required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/resolv"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000

# AI Provider ("groq" or "local")
AI_PROVIDER="groq"
GROQ_API_KEY="gsk_..."

# Email Notifications (optional for local dev)
RESEND_API_KEY="re_..."
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Migration
```bash
npx prisma db push
```

### 4. Seed Administrator Account
```bash
node seed-admin.js
```
Creates `admin@resolv.com` with password `admin123`.

### 5. Start Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

The server listens on `http://localhost:5000`.

## API Routes

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | /api/auth/register | Register resident account | Public |
| POST | /api/auth/login | Login and return JWT | Public |
| GET | /api/complaints | Fetch current resident complaints | Resident |
| POST | /api/complaints | Create complaint with photo attachment | Resident |
| POST | /api/complaints/pre-analyze | Run AI image and text pre-check | Resident |
| GET | /api/admin/complaints | List complaints with status and search filters | Admin |
| PATCH | /api/admin/complaints/:id/status | Update ticket status and resolution notes | Admin |
| POST | /api/admin/complaints/:id/suggest-reply | AI response recommendation | Admin |
| GET | /api/admin/users | List society users and staff | Admin |
| PATCH | /api/admin/users/:id/role | Promote or demote user roles | Admin |
| GET | /api/admin/analytics | Summary metrics and status breakdown | Admin |
| POST | /api/admin/query | Natural language database query engine | Admin |
| GET | /api/notifications | List unread and recent user notifications | Authenticated |
| PATCH | /api/notifications/read-all | Mark notifications as read | Authenticated |
