# Resolv Frontend Client

The web client for Resolv, an AI-assisted society management and complaint resolution platform.

Built with React 19, Vite, and Tailwind CSS. Provides dedicated portals for residents and administrators.

## Features

* Resident Portal: Ticket submission with photo uploads, AI image pre-analysis, status tracking, and notification updates.
* Admin Operations Center: Lifecycle ticket queue (Open, In Progress, Resolved), action confirmations, duplicate detection, and suggested replies.
* Operations Analytics: Distribution breakdown charts for complaint status, priority, and category.
* Query AI Interface: Natural language database queries with structured results and insight summaries.
* Role Management: In-app administrator assignment and resident role management.

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

Ensure `.env` contains:
```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Development Server
```bash
npm run dev
```

The application runs locally at `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
```

## Directory Structure

```
src/
├── api/          # Axios HTTP client with authentication interceptors
├── components/   # Reusable UI components (modals, user menu, navigation)
├── pages/        # Application views (Login, Register, ResidentDashboard, SubmitComplaint)
│   └── admin/    # Admin views (Dashboard, Analytics, Users, Query AI)
├── store/        # Zustand state management
├── App.jsx       # Route declarations and role-based guards
└── main.jsx      # Application entrypoint
```
