# Taskly

**Taskly** is a minimal, opinionated project management platform designed specifically for freelancers managing multiple client projects. Developed as a professional portfolio assessment project, Taskly prioritizes visual simplicity (inspired by Linear and Notion), security, performance, and clear Conventional patterns over complex abstractions.

---

## Live Demo
- **Frontend URL:** [https://taskly-app-demo.vercel.app](https://taskly-app-demo.vercel.app) *(Placeholder)*
- **Backend URL:** [https://taskly-api-demo.render.com](https://taskly-api-demo.render.com) *(Placeholder)*

---

## Screenshots

### Dashboard
*A minimal dashboard summarizing ongoing client work, completed tasks ratio, and recent items.*
![Dashboard](docs/screenshots/dashboard.png)

### Projects
*Freelancer-focused view displaying active client projects, pipeline statuses, and contracts.*
![Projects](docs/screenshots/projects.png)

### Tasks
*Deliverables list with urgency badges (Overdue, Due Today, Completed) and status toggles.*
![Tasks](docs/screenshots/tasks.png)

---

## Features

- **Authentication:** Token-based JWT authorization with bcrypt password hashing. Login rate limiting (10 attempts/15m) and Register rate limiting (5 attempts/15m) prevent brute force attacks. Enforces strong passwords (8+ chars, uppercase, lowercase, number).
- **Project Management:** Full owner-scoped CRUD. Projects cannot be accessed or modified by other authenticated users.
- **Task Management (Deliverables):** Tasks belong to projects. Includes inline task completion toggles.
- **Dashboard Analytics:** Computes project and task completion percentages, active metrics, and integrates a Recent Tasks widget showing the latest 5 tasks.
- **Search & Filtering:** Case-insensitive search by name. Filter projects by status, and tasks by status, priority, and project.
- **Pagination & Sorting:** Returns 10 items per page with page metadata. Sort projects by Newest/Oldest/Name; sort tasks by Due Date/Priority/Newest.
- **Optimistic UI:** Checkbox status toggles reflect instantly on the UI using TanStack Query cache updates, rolling back automatically on API failure.
- **Soft Delete:** Safe deletes (`deletedAt` timestamp) ensure client work data is preserved in the database for auditor histories while hiding it from active frontend views.
- **Demo Mode:** Click-to-log "View Demo Workspace" button logs directly into the pre-seeded freelancer profile (`demo@taskly.app`) with zero typing.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                             CLIENT (Vite)                              │
│  React Hooks ──► AuthContext ──► Axios Client ──► TanStack Query Cache │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / HTTPS (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                             API (Node.js)                              │
│  Express Server ──► Security Middleware ──► Controller Actions         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma Client
┌───────────────────────────────────▼────────────────────────────────────┐
│                           DATABASE (Neon)                              │
│  PostgreSQL (Indexed columns: ownerId, status, priority, dueDate)       │
└────────────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture
- **State Management:** React Context API manages active session states (`AuthContext.tsx`). TanStack Query (React Query) acts as our server-state cache, handling data synchronization, automated refetching, and optimistic UI mutations.
- **Forms:** React Hook Form bound with Zod schemas manages validation before dispatching requests, minimizing re-renders.

### Backend Architecture
- **Middlewares:**
  - `helmet`: Mounts essential HTTP security headers.
  - `cors`: Locks down cross-origin resource requests.
  - `express-rate-limit`: Secures auth routes against brute forcing.
  - `authenticateToken`: Standard JWT validation routing hook.
  - `validateBody`/`validateQuery`: Zod middleware interceptor.
- **Service Layer:** Standard Express controllers routing to Prisma ORM.

### Database Design
Designed for PostgreSQL. Relational hierarchy with Cascade Deletes: User (1) -> (N) Projects (1) -> (N) Tasks.

---

## Database Schema

### ER Diagram
```
  ┌──────────────┐
  │     User     │
  ├──────────────┤
  │ id (PK)      │ 1
  │ email (UQ)   ├──────────┐
  │ password     │          │
  │ createdAt    │          │
  │ updatedAt    │          │
  └──────────────┘          │
                            │
                            │ 1..*
                      ┌─────▼────────┐
                      │   Project    │
                      ├──────────────┤
                      │ id (PK)      │ 1
                      │ name         ├──────────┐
                      │ description  │          │
                      │ status       │          │
                      │ startDate    │          │
                      │ endDate      │          │
                      │ ownerId (FK) │          │
                      │ createdAt    │          │
                      │ deletedAt    │          │
                      └──────┬───────┘          │
                             │                  │
                             │                  │
                             │                  │ 1..*
                             │            ┌─────▼────────┐
                             │            │     Task     │
                             │            ├──────────────┤
                             └───────────►│ id (PK)      │
                                        * │ name         │
                                          │ description  │
                                          │ priority     │
                                          │ status       │
                                          │ dueDate      │
                                          │ projectId(FK)│
                                          │ createdAt    │
                                          │ deletedAt    │
                                          └──────────────┘
```

---

## API Documentation

All responses use a standardized JSON wrapper:
- **Success:** `{"success": true, "data": {...}}`
- **Error:** `{"success": false, "message": "..."}`
- **Validation Error:** `{"success": false, "message": "Validation failed", "errors": [{"field": "...", "message": "..."}]}`

### Endpoint Table

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user | No |
| **POST** | `/api/auth/login` | Authenticate and obtain JWT | No |
| **POST** | `/api/auth/logout` | Invalidate client session | No |
| **GET** | `/api/projects` | Fetch all user projects (paged/filtered) | Yes |
| **POST** | `/api/projects` | Create a new project | Yes |
| **GET** | `/api/projects/:id` | Fetch specific project details | Yes |
| **PUT** | `/api/projects/:id` | Update project details | Yes |
| **DELETE** | `/api/projects/:id` | Soft-delete project & nested tasks | Yes |
| **GET** | `/api/tasks` | Fetch user tasks (paged/filtered/sorted) | Yes |
| **POST** | `/api/tasks` | Create a task under a project | Yes |
| **GET** | `/api/tasks/:id` | Fetch specific task details | Yes |
| **PUT** | `/api/tasks/:id` | Update task details / toggle complete | Yes |
| **DELETE** | `/api/tasks/:id` | Soft-delete task | Yes |
| **GET** | `/api/dashboard` | Aggregated dashboard stats & recent tasks | Yes |

---

### Request & Response Examples

#### Register User (`POST /api/auth/register`)
- **Request:**
  ```json
  {
    "email": "freelancer@taskly.app",
    "password": "TasklyPassword@2026"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e22a45b6-7b2c-491d-aa89-56fd62d98c11",
        "email": "freelancer@taskly.app"
      }
    }
  }
  ```

#### Fetch Dashboard Stats (`GET /api/dashboard`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 3,
      "projectsInProgress": 1,
      "totalTasks": 14,
      "completedTasks": 5,
      "pendingTasks": 7,
      "inProgressTasks": 2,
      "completionPercentage": 36,
      "recentTasks": [
        {
          "id": "c3a60897-746e-482b-8a80-9a35d3fcc009",
          "name": "Design Logo vectors",
          "priority": "HIGH",
          "status": "IN_PROGRESS",
          "dueDate": "2026-06-18T00:00:00.000Z",
          "projectId": "b90688e9-9bd6-4540-ab8b-8c640e7030e2",
          "project": {
            "name": "Acme Corp Branding"
          }
        }
      ]
    }
  }
  ```

---

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Docker Desktop (Optional, for containerized runner)

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/taskly.git
   cd taskly
   ```
2. **Install all workspace dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```
3. **Configure Environment variables:**
   Create `.env` at the root and inside the `backend/` folder:
   ```env
   DATABASE_URL="Create a Posgress URL"
   PORT=5000
   JWT_SECRET="your_jwt_secret_key"
   NODE_ENV="development"
   ```
4. **Initialize migrations and seed database:**
   ```bash
   # This runs migrations and seeds the demo account demo@taskly.app
   npx prisma migrate dev --schema=prisma/schema.prisma
   npx prisma db seed --schema=prisma/schema.prisma
   ```
5. **Run locally:**
   - **Backend:** `cd backend && npm run dev`
   - **Frontend:** `cd frontend && npm run dev`
   - Open browser to `http://localhost:5173`. Click **View Demo Workspace** to log in instantly.

### Running with Docker
Start both services in production containers using docker-compose:
```bash
docker compose up --build
```
The application will be accessible at `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend).

---

## Environment Variables

### Backend & Database Config
- `DATABASE_URL`: Connection string to PostgreSQL instance (Neon).
- `PORT`: Network port for Express server (Default: `5000`).
- `JWT_SECRET`: Random hash key used to encode and sign JWT access tokens.
- `NODE_ENV`: Runs node in `development` or `production` configuration mode.

### Frontend Config
- `VITE_API_URL`: Path to backend server endpoints (Default: `http://localhost:5000/api`).

---

## Future Improvements

1. **Audit Logs:** Log key user adjustments (e.g. project status completions, deliverables archive).
2. **Database Enum Portability:** Transition database-independent priority/status strings to native PostgreSQL Enums for stronger schema typing.
3. **Optimistic Task Drag & Drop:** Upgrade visual columns to enable kanban-style drag-and-drop boards with optimistic state updates.
