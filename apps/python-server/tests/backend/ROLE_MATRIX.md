# Role Permission Matrix (Monolith Source of Truth)

Derived from `apps/python-server/routers/*` dependency guards and endpoint logic.

## Superadmin

- Allowed: platform admin CRUD (`/api/v1/admins/*`), institution/vendor/batch/teacher/student/course/problem/assessment/report management
- Restricted: none by role guard (functional constraints still apply)

## Admin

- Allowed: institution/vendor/batch/teacher/student management, courses/problems/assessments/reports, stats/dashboard
- Restricted: superadmin-only admin CRUD (`/api/v1/admins/create-admin`, `/get-all-admin`, `/get-admin-by-id/{id}`, `/update-admin-by-id/{id}`, `/delete-admin-by-id/{id}`)

## Institution

- Allowed: own institution management flows, batches/teachers/students, assessment/course/report operational flows
- Restricted: superadmin-only admin CRUD; role-elevation actions

## Vendor

- Allowed: create institutions, vendor dashboard, assigned institution workflows
- Restricted: superadmin-only admin CRUD; cross-tenant institution/vendor modifications

## Teacher

- Allowed: teaching workflows (create/manage course/problem/assessment paths; code submit where allowed)
- Restricted: admin/superadmin governance routes, student-only submission/result paths

## Student

- Allowed: student learning flows (`/api/v1/courses/get-student-courses`, assignment progress/marks, problem solving/submission, assessment submission)
- Restricted: admin/institution/vendor governance endpoints and privileged report management

## Security Expectations Validated in Tests

- Role mismatch must return `401`/`403`
- Student must not manage enrollments/users/vendors/institutions
- Vendor must not mutate institutions outside ownership scope
- JWT tampering must fail authentication
- Cross-role token misuse must not escalate privileges
