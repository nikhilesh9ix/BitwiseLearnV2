# BitwiseLearn

A multi-tenant educational platform for institutions, vendors, and students — featuring course management, DSA problem solving with online code execution, timed assessments, and analytics reporting.

## Features

- **Multi-Tenant Auth** — role-based access for Superadmin, Admin, Institution, Vendor, Teacher, and Student with JWT (access + refresh tokens), OTP verification, and password reset
- **Institution & Vendor Management** — CRUD operations, batch management, teacher/student assignment
- **Course System** — courses with sections, learning content (video/PDF/text), assignments (MCQ/SCQ), enrollment tracking, and progress monitoring
- **DSA Problem Bank** — problems by topic and difficulty (Easy/Medium/Hard), code templates in 5 languages (Python, Java, JavaScript, C, C++), test cases (example + hidden), and solution storage
- **Online Code Execution** — compile and run code against test cases via Piston API, submit solutions with per-testcase result tracking
- **Timed Assessments** — create assessments with sections and questions, proctoring (cheating detection flag), timed submissions with auto-grading
- **Bulk Upload** — Excel-based bulk import for students, test cases, and assessment questions
- **Reports & Analytics** — institution/vendor/batch stats, course reports, assessment reports with per-student breakdown, async report generation via RabbitMQ
- **File Storage** — AWS S3 for documents, Cloudinary for images/videos
- **Contact Form** — email-based contact/support system

## Tech Stack

### Backend
- **Framework**: FastAPI 0.115.6 + Uvicorn
- **Database**: MongoDB with Beanie 1.27.0 ODM (Motor async driver)
- **Auth**: PyJWT, Passlib + bcrypt
- **Queue**: RabbitMQ via aio-pika
- **Storage**: AWS S3 (boto3), Cloudinary
- **Code Execution**: Piston API
- **Validation**: Pydantic 2.10.3
- **Rate Limiting**: SlowAPI

### Frontend
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS
- **State**: Zustand
- **UI**: Lucide icons, Radix UI, Framer Motion
- **Code**: PrismJS syntax highlighting
- **Markdown**: react-markdown with KaTeX math, GFM tables
- **Charts**: Recharts
- **PDF**: jsPDF + html2canvas

## Project Structure

```
BitwiseV2/
├── frontend/                    # Next.js frontend
│   └── src/
│       ├── app/                 # App Router pages
│       ├── components/          # React components
│       ├── store/               # Zustand stores
│       └── lib/                 # Utilities
│
├── apps/
│   ├── python-server/           # Monolith backend (recommended for dev)
│   │   ├── main.py
│   │   ├── routers/             # 14 route modules
│   │   ├── models/              # 26 Beanie document models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Email, S3, Cloudinary, Piston, Queue
│   │   ├── middleware/          # JWT auth + role guards
│   │   ├── utils/               # JWT, OTP, password, reset tokens
│   │   ├── config.py
│   │   └── enums.py
│   │
│   ├── shared/                  # Shared Python package (for microservices)
│   ├── gateway/                 # API Gateway (port 8000)
│   ├── auth-service/            # Auth microservice (port 8001)
│   ├── user-service/            # User management (port 8002)
│   ├── course-service/          # Courses (port 8003)
│   ├── problem-service/         # DSA problems (port 8004)
│   ├── assessment-service/      # Assessments (port 8005)
│   ├── code-service/            # Code execution (port 8006)
│   ├── notification-service/    # Emails/contact (port 8007)
│   └── report-service/          # Reports (port 8008)
│
├── docker-compose.yml           # Full stack Docker setup
├── run-services.ps1             # Local microservices launcher
└── ARCHITECTURE.md              # Monolith vs microservices comparison
```

## Architecture Policy

- `apps/python-server/` is the canonical implementation for feature work and local debugging.
- The shared package and `apps/*-service/` folders must preserve the same contracts as the monolith path.
- Changes to auth, models, schemas, or cross-cutting behavior should be made against the monolith first, then aligned in the shared/microservice path before shipping Docker or gateway-based deployments.

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (running locally or connection string)
- RabbitMQ (optional — for async report generation)

## Environment Variables

Create a `.env` file in the project root (or in `apps/python-server/`):

```env
DATABASE_URL=mongodb://localhost:27017/bitwiselearn
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
RESET_TOKEN_SECRET=your-reset-token-secret
FRONTEND_URL=http://localhost:3000

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=ap-south-1
AWS_S3_BUCKET=bitwise-learn

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASS=

MQ_CLIENT=amqp://guest:guest@localhost/
CODE_EXECUTION_SERVER=http://localhost:2000/
```

## Self-Hosted Piston (Free Code Execution)

Public EMKC execution endpoints are whitelist-restricted. For reliable free execution, run your own Piston instance.

### Start Piston only

```bash
docker compose up -d piston
```

### Verify Piston is reachable

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"python3","version":"*","files":[{"name":"main.py","content":"print(\"Hello, World!\")"}]}'
```

You should get JSON with `run.stdout`.

### Run Bitwise with Piston

- Monolith (`apps/python-server`) uses `CODE_EXECUTION_SERVER=http://localhost:2000/`.
- Docker microservices are wired to `http://piston:2000/` for `code-service` and `assessment-service` in `docker-compose.yml`.

## Getting Started

### Option 1: Monolith (Recommended for Development)

```bash
# Backend
cd apps/python-server
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Option 2: Microservices

```powershell
# Starts all 9 services in separate windows
.\run-services.ps1
```

### Option 3: Docker

```bash
docker-compose up --build
```

## API Overview

All API routes are prefixed with `/api/v1/`.

| Prefix | Description |
|---|---|
| `/api/v1/auth` | Login (per role), refresh token, OTP, password reset |
| `/api/v1/admins` | Superadmin/admin CRUD |
| `/api/v1/institutions` | Institution management |
| `/api/v1/vendors` | Vendor management |
| `/api/v1/batches` | Batch CRUD, student/teacher assignment |
| `/api/v1/teachers` | Teacher management |
| `/api/v1/students` | Student management |
| `/api/v1/bulk-upload` | Excel bulk import (students, test cases, assessments) |
| `/api/v1/courses` | Courses, sections, content, assignments, enrollment, progress |
| `/api/v1/problems` | DSA problems, topics, templates, test cases, solutions |
| `/api/v1/assessments` | Assessments, sections, questions, submissions |
| `/api/v1/code` | Code compile, run, submit |
| `/api/v1/reports` | Institution/vendor/batch stats, course/assessment reports |
| `/api/v1/contact` | Contact form email |

## User Roles

| Role | Access Level |
|---|---|
| **Superadmin** | Full platform control, admin CRUD |
| **Admin** | Manage institutions, vendors, view reports |
| **Institution** | Manage own batches, teachers, students, courses |
| **Vendor** | Manage assigned institutions |
| **Teacher** | Create courses, problems, assessments for assigned batches |
| **Student** | Enroll in courses, solve problems, take assessments |

