# Resolv: Smart Society Management and Complaint Resolution Platform

Resolv is an AI-assisted complaint management and society operations platform built for residential communities and commercial facilities. It streamlines maintenance workflows through automated ticket categorization, semantic duplicate detection, image inspection, natural language analytics, and transactional notifications.

## Architecture

* Frontend: React 18, Vite, Tailwind CSS, TanStack Query, Zustand
* Backend: Node.js, Express, Prisma ORM, PostgreSQL
* AI Service: Decoupled adapter supporting Groq Cloud LPU inference and local Ollama or vLLM deployments
* Notifications: Resend transactional email API

## Core Features

* Resident Portal: Ticket filing with photo attachments, AI image pre-analysis, real-time status tracking, and notification bell.
* Admin Operations Center: Lifecycle triage queue (Open, In Progress, Resolved), action confirmations, duplicate detection, and suggested resolution responses.
* Query AI (Text-to-SQL): Converts natural language operational questions into secure PostgreSQL queries with executive insight summaries.
* Role-Based Access Control: Dedicated interfaces for residents and administrators with in-app role promotion and demotion.

## Quick Start

### 1. Prerequisites
* Node.js 18 or higher
* PostgreSQL database

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd society-resume
npm install
```

Copy the environment template:
```bash
cp .env.example .env
```

Configure your database connection, JWT secret, and API keys in `.env`.

Apply database migrations:
```bash
npx prisma db push
```

(Optional) Seed initial administrator:
```bash
node seed-admin.js
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd ../trackly-frontend
npm install
```

Copy the environment template:
```bash
cp .env.example .env
```

Start the client development server:
```bash
npm run dev
```

The web application runs locally at `http://localhost:5173` and connects to the API at `http://localhost:5000`.

## Security

* Parameterized database queries and AST validation guardrails for Text-to-SQL execution
* Scoped CORS restricted to designated frontend origins
* Cryptographically hashed passwords with bcrypt
* Sanitized file upload storage with timestamped pseudorandom naming
* JWT payload verification with role-based route middleware

## License
ISC
