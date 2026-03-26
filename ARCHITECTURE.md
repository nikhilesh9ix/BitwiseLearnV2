# Monolith vs Microservices — BitwiseLearn Architecture Comparison

## Current Team Rule

- `apps/python-server/` is the source of truth for day-to-day development.
- The microservice layout exists for deployment topology and service-boundary experimentation, but it should preserve the monolith's request/response behavior.
- Any change that touches auth, models, schemas, or shared utilities should be validated in both paths before release.

## Monolith (`apps/python-server/`)

### Pros
- **Single process** — one `uvicorn` command, one log stream, one debugger
- **Zero network overhead** — all function calls are in-process, no HTTP latency between services
- **ACID transactions** — MongoDB sessions work across all collections natively
- **Simple deployment** — one Dockerfile, one server, one `.env`
- **Easy to reason about** — entire codebase fits in your head at once
- **Fast onboarding** — new dev can `uv pip install -r requirements.txt` and run immediately
- **No distributed tracing needed** — stack traces show the full call chain
- **No serialization overhead** — objects passed directly, not JSON-encoded over HTTP

### Cons
- **Deploy everything or nothing** — a one-line change to the contact form forces redeploying the entire app
- **Scales as a unit** — if code execution gets hammered, you must scale the whole server, not just that feature
- **One crash can kill everything** — an unhandled exception in one router can bring down all routes
- **Technology lock-in** — entire app must use Python; can't use a different language for a specific feature
- **Team bottleneck** — multiple devs working on the same repo cause merge conflicts more often
- **Growing complexity over time** — as features are added, the codebase becomes harder to navigate

---

## Microservices (`apps/*/`)

### Pros
- **Independent deployment** — redeploy only course-service without touching auth or assessments
- **Independent scaling** — run 5 replicas of code-service during contests, 1 of everything else
- **Fault isolation** — code-service crashes, everything else keeps running
- **Technology flexibility** — could rewrite code execution in Go/Rust without touching Python services
- **Team autonomy** — separate ownership, separate CI/CD pipelines per service
- **Smaller codebases** — each service is focused and easier to understand in isolation
- **Kubernetes-native** — fits naturally into container orchestration with health checks and rolling deploys

### Cons
- **Shared database** *(current setup)* — all services hit the same MongoDB, so data coupling of a monolith remains but with all the operational complexity of microservices — worst of both worlds unless databases are eventually split
- **9x startup complexity** — 9 processes, 9 terminals, 9 logs to check when something goes wrong
- **Network failures** — a gateway timeout or connection refused becomes a new class of bug that didn't exist before
- **No cross-service transactions** — if user-service creates a student and course-service creates an enrollment in the same request, there's no rollback if one fails
- **Distributed debugging** — a single user request touches gateway → auth middleware → domain service; tracing it requires correlating logs across 3 processes
- **Added latency** — every API call does: `client → gateway (HTTP) → service (HTTP)` instead of direct in-process calls
- **Operational overhead** — 9 Dockerfiles, 9 `requirements.txt`, docker-compose, shared package versioning, gateway routing table to maintain
- **Shared package is a hidden monolith** — `shared/` contains models, schemas, middleware, services, utils, and config; changing a model requires updating and redeploying every service
