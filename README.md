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

This project is a full-stack education platform with two backend runtime modes:

- **Monolith mode (recommended for development)** in `apps/python-server`
- **Microservices mode (deployment topology)** in `apps/*-service` plus `apps/gateway`

The frontend stays the same in both modes.

### Architecture At A Glance

1. User interacts with the Next.js frontend.
2. Frontend calls API routes (proxy) or backend endpoints directly.
3. Backend handles auth, business logic, and persistence.
4. Async/report tasks use RabbitMQ + worker where applicable.
5. File assets are stored in S3/Cloudinary, with local fallback support in development.
6. Code execution routes call the Piston execution service.

### Frontend Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 16 + React 19 + TypeScript | App UI, routing, rendering |
| Styling | Tailwind CSS 4 | Utility-first styling |
| State | Zustand | Lightweight global state stores |
| HTTP Client | Axios | Browser and proxy API requests |
| UI Utilities | Radix Tabs, Lucide, Framer Motion | Accessible primitives, icons, motion |
| Data Visualization | Recharts | Report charts and analytics cards |
| Markdown + Math | react-markdown, remark-math, rehype-katex, remark-gfm | Rich text and math rendering |
| Code Display | PrismJS, rehype-prism-plus, Monaco Editor | Syntax highlighting and code editor experiences |
| PDF/Reporting UI | @react-pdf/renderer, jsPDF, html2canvas | Downloadable report views and exports |

### Backend Stack (Monolith Core)

| Area | Technology | Purpose |
| --- | --- | --- |
| API Framework | FastAPI 0.115.6 | HTTP API definitions and validation |
| Server Runtime | Uvicorn 0.34.0, Gunicorn 23.0.0 | Local dev and production serving |
| Data Layer | Beanie 1.27.0 + Motor 3.6.0 | Async ODM over document database |
| Validation | Pydantic 2.10.3 + pydantic-settings 2.7.0 | Request models and configuration |
| Auth | PyJWT 2.10.1, Passlib, bcrypt | Access/refresh JWT auth and password hashing |
| Rate Limiting | SlowAPI | Endpoint throttling |
| Async Messaging | aio-pika 9.5.3 + RabbitMQ | Async processing and report task flow |
| File Storage | boto3 (S3), Cloudinary SDK | Content/report storage |
| Spreadsheet Import | openpyxl | Bulk upload workflows |
| Templating | Jinja2 | Email/template rendering |
| HTTP Calls | httpx | Internal/external HTTP integrations |

### Code Execution Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| Execution Engine | Piston | Multi-language compile/run |
| Supported Language Flow | Python, Java, JavaScript, C, C++ templates | Problem solving and auto-evaluation |
| Integration Points | assessment and code routes/services | Run, submit, and testcase grading |

### Storage And File Handling

| Data Type | Primary Store | Dev Fallback |
| --- | --- | --- |
| Course content files | AWS S3 | Local uploads served by backend |
| Media (images/videos) | Cloudinary | Local/dev fallback paths |
| Report artifacts | S3/object URL patterns | Local/dev fallback URLs |

### Deployment Topology Stack

| Mode | Components |
| --- | --- |
| Monolith | `apps/python-server` + `frontend` |
| Microservices | `gateway`, `auth-service`, `user-service`, `course-service`, `problem-service`, `assessment-service`, `code-service`, `notification-service`, `report-service` |
| Shared package | `apps/shared` for common contracts/utilities |
| Containerization | Docker + docker-compose |

### Service Ports (Microservices Mode)

| Service | Default Port | Responsibility |
| --- | --- | --- |
| gateway | 8000 | Entry-point routing |
| auth-service | 8001 | Authentication |
| user-service | 8002 | User domain |
| course-service | 8003 | Courses, sections, enrollments |
| problem-service | 8004 | DSA problem bank |
| assessment-service | 8005 | Assessment management |
| code-service | 8006 | Code run/submit integration |
| notification-service | 8007 | Contact/notification flow |
| report-service | 8008 | Report endpoints and generation |
| piston | 2000 | Code execution engine |
| rabbitmq | 5672 / 15672 | Queue and management UI |

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
- uv (recommended Python package/environment manager)
- Node.js 18+
- Document database (running locally or connection string)
- RabbitMQ (optional — for async report generation)

## Environment Variables

Create a `.env` file in the project root (or in `apps/python-server/`):

```env
DATABASE_URL=<db_connection_string>
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
uv run --no-project --with-requirements requirements.txt uvicorn main:app --reload --host 0.0.0.0 --port 8000

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

