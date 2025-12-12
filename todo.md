# L&D Portal MVP - Development TODO

## ✅ Step 1: Core Infrastructure (COMPLETED)
- [x] FastAPI application setup with async support
- [x] PostgreSQL database with Docker Compose
- [x] Async SQLAlchemy + SQLModel ORM setup
- [x] Alembic migrations configuration
- [x] Environment configuration with pydantic-settings
- [x] JWT authentication implementation
- [x] Password hashing with bcrypt
- [x] Error handling middleware
- [x] Database session management with dependency injection
- [x] Application lifespan events
- [x] Health check endpoint

## ✅ Step 2: Domain Models (COMPLETED)
- [x] User model with roles (EMPLOYEE, MANAGER, ADMIN, SUPER_ADMIN)
- [x] Department model
- [x] Profile model with JSON fields (tech_stack, skills)
- [x] Training model with status tracking
- [x] TrainingSession model
- [x] Enrollment model with status tracking
- [x] Attendance model
- [x] TrainingCompletion model
- [x] Badge model with types (BRONZE, SILVER, GOLD, PLATINUM)
- [x] Notification model
- [x] Certification model
- [x] TimestampMixin for created_at/updated_at
- [x] Initial database migration generated and applied

## ✅ Step 3: Base API Routes (COMPLETED)
- [x] Auth routes (register, login)
- [x] User routes (get current user, get by id, list users)
- [x] Profile routes (get/update own profile)
- [x] Training routes (create, get, list, update)
- [x] Enrollment routes (enroll, get my enrollments)
- [x] Notification routes (list, mark as read)
- [x] All routers mounted in main app
- [x] Swagger UI documentation available
- [x] End-to-end authentication tested (register → login → protected endpoints)

---

## ✅ Step 4: Complete Domain Endpoints (COMPLETED - Priority 1)

### Priority 1: Essential CRUD Operations ✅
- [x] **Department endpoints**
  - [x] POST /api/departments - Create department (admin only)
  - [x] GET /api/departments - List all departments
  - [x] GET /api/departments/{id} - Get department details
  - [x] PUT /api/departments/{id} - Update department (admin only)
  - [x] DELETE /api/departments/{id} - Delete department (admin only)

- [x] **Certification endpoints**
  - [x] POST /api/certifications - Add certification for user
  - [x] GET /api/certifications/my - Get my certifications
  - [x] GET /api/certifications/{id} - Get certification details
  - [x] PUT /api/certifications/{id} - Update certification
  - [x] DELETE /api/certifications/{id} - Delete certification

- [x] **Training Session endpoints**
  - [x] POST /api/sessions - Create session for training
  - [x] GET /api/sessions/training/{training_id} - List sessions for training
  - [x] GET /api/sessions/{id} - Get session details
  - [x] PUT /api/sessions/{id} - Update session
  - [x] DELETE /api/sessions/{id} - Delete session

- [x] **Attendance endpoints**
  - [x] POST /api/attendance - Mark attendance for session
  - [x] GET /api/attendance/session/{session_id} - Get attendance for session
  - [x] GET /api/attendance/enrollment/{enrollment_id} - Get attendance history
  - [x] PUT /api/attendance/{id} - Update attendance record

### Priority 2: Business Logic Features ✅
- [x] **Training approval workflow**
  - [x] PUT /api/trainings/{id}/submit - Submit training for approval (sets PENDING_APPROVAL)
  - [x] PUT /api/trainings/{id}/approve - Approve training (admin/super_admin only)
  - [x] PUT /api/trainings/{id}/reject - Reject training with reason (admin/super_admin only)
  - [x] GET /api/trainings/pending - List trainings pending approval (admin only)

- [x] **Manager assignment features**
  - [x] POST /api/manager/assign-training - Assign training to team member
  - [x] GET /api/manager/team - View team members
  - [x] GET /api/manager/team-trainings - View team training progress
  - [x] DELETE /api/manager/assignments/{id} - Remove training assignment

- [x] **Training completion logic**
  - [x] POST /api/completions/calculate/{enrollment_id} - Calculate and create completion record
  - [x] Calculate attendance_percentage based on Attendance records
  - [x] Calculate learning_hours from session durations
  - [x] Update enrollment status to COMPLETED
  - [x] GET /api/completions/user/{user_id} - Get user completions
  - [x] GET /api/completions/{id} - Get completion details
  - [x] PUT /api/completions/{id}/issue-certificate - Issue certificate

- [x] **Badge awarding system**
  - [x] POST /api/badges/calculate/{user_id}/{year} - Calculate and award badge
  - [x] Automatic badge assignment based on hours:
    - BRONZE: 20+ hours
    - SILVER: 40+ hours
    - GOLD: 60+ hours
    - PLATINUM: 80+ hours
  - [x] GET /api/badges/user/{user_id} - Get user badges
  - [x] GET /api/badges/statistics/{user_id} - Get badge progress
  - [x] Notification creation when badge awarded

### Priority 3: Notifications & Reminders ✅
- [x] **Notification creation triggers**
  - [x] On training assignment (in manager/assign-training)
  - [x] On training approval/rejection (in trainings/approve and trainings/reject)
  - [x] On badge award (in badges/calculate)
  - [x] On upcoming session (background job - 1 day before)
  - [x] On enrollment confirmation (in enrollments POST)

- [x] **Background tasks setup**
  - [x] Install APScheduler
  - [x] Daily job for session reminders (runs at 9 AM daily)
  - [x] Yearly job for badge calculations (runs January 1st at midnight)
  - [x] Configure task scheduling in app lifespan
  - [x] Created notification service helper (src/core/notifications.py)
  - [x] Created scheduler module (src/core/scheduler.py)

### Priority 4: Reporting & Analytics ✅
- [x] **User reports**
  - [x] GET /api/reports/user/{user_id}/training-history - User's completed trainings (with optional year filter)
  - [x] GET /api/reports/user/{user_id}/learning-hours - Learning hours grouped by year
  - [x] GET /api/reports/user/{user_id}/badges - Badge achievement history

- [x] **Manager reports**
  - [x] GET /api/reports/manager/{manager_id}/team-progress - Team training progress with detailed stats
  - [x] GET /api/reports/manager/{manager_id}/team-completion-rate - Team completion statistics with top performers

- [x] **Admin reports**
  - [x] GET /api/reports/admin/training-stats - Overall training statistics across organization
  - [x] GET /api/reports/admin/department-stats - Department-wise analytics with completion rates
  - [x] GET /api/reports/admin/badge-distribution - Badge distribution (with optional year filter)

---

## 🎯 Step 5: Testing & Validation (TODO)
- [ ] Unit tests for core security functions
- [ ] Integration tests for API endpoints
- [ ] Test authentication flows
- [ ] Test authorization (role-based access)
- [ ] Test business logic (approval workflows, badge calculations)
- [ ] Test edge cases (duplicate enrollments, invalid dates, etc.)

---

## 🚀 Step 6: Frontend Integration (TODO)
- [ ] Share schemas/bundle.json with frontend team
- [ ] Document authentication flow (register → login → use Bearer token)
- [ ] Document all API endpoints with examples
- [ ] Set up CORS for frontend domain
- [ ] Test end-to-end flows with frontend

---

## 📝 Notes
- **Current Approach**: Pragmatic "progress over perfection" - implement base functionality first, then add complexity
- **Testing Strategy**: Use Swagger UI at http://localhost:8000/docs for interactive testing
- **Authentication**: JWT tokens with 30-minute expiry, Bearer token format
- **Database**: PostgreSQL running in Docker on port 5432
- **Registered Test User**: admin@lms.com / admin123 (EMPLOYEE role)
