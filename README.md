# Software Requirements Specification (SRS)

## L&D Portal MVP - Build-AI-Thon

**Version:** 1.0  
**Date:** December 12, 2025  
**Project:** Lightweight Learning & Development Portal

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for a lightweight Learning & Development (L&D) Portal MVP designed to manage employee training programs, track learning progress, and provide role-based access control for organizational learning management.

### 1.2 Scope

The L&D Portal is a web-based application that enables:

- Role-based user management (Employee, Admin, Super Admin, Manager)
- Training creation, assignment, and enrollment workflows
- Attendance and completion tracking
- Employee learning profiles with skill tracking
- Reporting and analytics capabilities
- Gamification through badges and certificates

### 1.3 Definitions and Acronyms

- **L&D**: Learning & Development
- **MVP**: Minimum Viable Product
- **RBAC**: Role-Based Access Control
- **UI**: User Interface
- **API**: Application Programming Interface

### 1.4 Target Audience

- Employees seeking training opportunities
- Administrators managing training programs
- Super Administrators overseeing organizational learning
- Managers monitoring team development
- HR and L&D Teams

---

## 2. Overall Description

### 2.1 Product Perspective

The L&D Portal is a standalone web application that serves as a centralized platform for organizational learning management. It integrates training creation, assignment, enrollment, tracking, and reporting functionalities into a single cohesive system.

### 2.2 User Roles and Characteristics

#### 2.2.1 Employee

- **Primary Users**: All organizational staff
- **Capabilities**: View training catalog, enroll in trainings, track personal learning progress
- **Technical Expertise**: Basic computer literacy

#### 2.2.2 Admin

- **Primary Users**: L&D coordinators, HR training managers
- **Capabilities**: Create trainings, assign to employees/departments, manage training content
- **Technical Expertise**: Intermediate system knowledge

#### 2.2.3 Super Admin

- **Primary Users**: L&D heads, senior HR leadership
- **Capabilities**: All Admin capabilities plus approval of mandatory trainings, system configuration
- **Technical Expertise**: Advanced system knowledge

#### 2.2.4 Manager (Good-to-Have)

- **Primary Users**: Team leads, department heads
- **Capabilities**: View reportees' learning profiles, monitor mandatory training completion
- **Technical Expertise**: Intermediate system knowledge

### 2.3 Constraints

- Must be lightweight and scalable
- Must be deployable as an MVP with core features
- Code must be version-controlled in a public Git repository
- Must support standard web browsers (Chrome, Firefox, Safari, Edge)

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization (Must-Have)

#### FR-1.1: User Login

- **Description**: System shall provide a login interface for all user roles
- **Input**: Username/Email and Password
- **Process**:
  - Validate credentials against user database
  - Authenticate user identity
  - Establish user session
- **Output**: Redirect to role-appropriate dashboard
- **Validation**:
  - Email format validation
  - Password strength requirements (min 8 characters)
  - Account lockout after 5 failed attempts

#### FR-1.2: Role-Based Access Control

- **Description**: System shall enforce role-based permissions
- **Roles**: Employee, Admin, Super Admin, Manager (optional)
- **Access Matrix**:

| Feature                    | Employee | Admin | Super Admin | Manager |
| -------------------------- | -------- | ----- | ----------- | ------- |
| View Own Profile           | ✓        | ✓     | ✓           | ✓       |
| View Training Catalog      | ✓        | ✓     | ✓           | ✓       |
| Enroll in Training         | ✓        | ✓     | ✓           | ✓       |
| Create Training            | ✗        | ✓     | ✓           | ✗       |
| Assign Training            | ✗        | ✓     | ✓           | ✗       |
| Approve Mandatory Training | ✗        | ✗     | ✓           | ✗       |
| View Reportee Profiles     | ✗        | ✗     | ✓           | ✓       |
| Generate Reports           | ✗        | ✓     | ✓           | ✓       |

#### FR-1.3: Session Management

- Session timeout after 30 minutes of inactivity
- Secure session token storage
- Logout functionality

---

### 3.2 Employee Learning Profile (Must-Have)

#### FR-2.1: Profile Creation & Management

- **Description**: Each employee shall have a comprehensive learning profile
- **Profile Components**:
  - Personal Information (Name, Employee ID, Email, Department, Role)
  - Tech Stack (Programming languages, frameworks, tools)
  - Certifications (Name, issuing body, date obtained, expiry date)
  - Training History (Completed, In-progress, Upcoming)
  - Learning Hours (Total, Annual, Monthly breakdown)
  - Skills & Competencies
  - Badges & Achievements

#### FR-2.2: Tech Stack Management

- Employees can add/edit their technical skills
- Skills categorized by proficiency level (Beginner, Intermediate, Advanced, Expert)
- Admin can verify/endorse skills

#### FR-2.3: Certification Tracking

- Add external certifications with proof of completion
- Track certification expiry dates
- Notification system for expiring certifications

#### FR-2.4: Training History Display

- Chronological list of all trainings
- Status indicators (Completed, In Progress, Enrolled, Assigned)
- Completion dates and attendance records
- Downloadable completion certificates

---

### 3.3 Training Management (Must-Have)

#### FR-3.1: Training Creation (Admin)

- **Description**: Admins can create new training programs
- **Training Attributes**:
  - Training Title (required, max 200 characters)
  - Description (required, max 2000 characters)
  - Category (Technical, Soft Skills, Compliance, Leadership, etc.)
  - Duration (in hours)
  - Training Type (Online, Classroom, Workshop, Webinar)
  - Instructor/Facilitator
  - Prerequisites (if any)
  - Maximum Participants
  - Training Materials (documents, links, videos)
  - Start Date & End Date
  - Schedule (Date/Time for sessions)
  - Location (for physical trainings)
  - Status (Draft, Published, Ongoing, Completed, Cancelled)

#### FR-3.2: Training Types Classification

- **Open Training**: Any employee can enroll
- **Department-Specific Training**: Only specific departments can view/enroll
- **Assigned Training**: Assigned to specific employees
- **Mandatory Training**: Requires completion, needs Super Admin approval

#### FR-3.3: Mandatory Training Approval Workflow

- **Process Flow**:
  1. Admin creates training and marks as "Mandatory"
  2. Training status set to "Pending Approval"
  3. Super Admin receives notification
  4. Super Admin reviews and approves/rejects
  5. Upon approval, training becomes active and visible to assigned employees
  6. Rejection sends training back to draft with comments

#### FR-3.4: Training Assignment (Admin)

- **Assignment Options**:
  - Assign to All Employees
  - Assign to Specific Departments (multi-select)
  - Assign to Individual Employees (search and select)
- **Assignment Process**:
  - Select training
  - Choose assignment method
  - Select target audience
  - Set deadline (for mandatory trainings)
  - Send notifications to assigned employees

---

### 3.4 Training Enrollment & Viewing (Must-Have)

#### FR-4.1: Training Catalog View (Employee)

- **Description**: Employees can browse available trainings
- **View Filters**:
  - Upcoming Trainings (sorted by date)
  - Department-Specific Trainings
  - Mandatory Trainings
  - Open Trainings
  - My Enrolled Trainings
  - My Assigned Trainings
  - Completed Trainings
- **Sorting Options**: Date, Title, Category, Duration
- **Search Functionality**: By title, category, instructor

#### FR-4.2: Training Details View

- Display complete training information
- Show available seats vs. total capacity
- Display prerequisite requirements
- Show enrollment deadline
- List training materials
- Display enrolled participants count

#### FR-4.3: Training Enrollment (Employee)

- **Open Training Enrollment**:
  - Employee can self-enroll in open trainings
  - System checks available capacity
  - Immediate confirmation upon successful enrollment
  - Email notification sent
- **Enrollment Constraints**:
  - Cannot enroll if capacity full
  - Cannot enroll if prerequisites not met
  - Cannot enroll in conflicting time slots
  - Cannot unenroll from mandatory/assigned trainings

#### FR-4.4: Assigned Training View

- Employees automatically see trainings assigned to them
- Cannot unenroll from assigned trainings
- Mandatory trainings highlighted with special indicator
- Deadline display for mandatory trainings

---

### 3.5 Attendance & Completion Tracking (Must-Have)

#### FR-5.1: Attendance Recording

- **Admin/Instructor Capabilities**:
  - Mark attendance for each session
  - Mark attendance as Present, Absent, Partially Present
  - Add attendance notes/comments
  - Bulk attendance marking
- **Attendance Rules**:
  - Minimum attendance threshold: 80% for completion credit
  - Partial attendance counts as 50% of session duration

#### FR-5.2: Completion Tracking

- **Completion Criteria**:
  - Attendance >= 80% of sessions
  - Completion of assessments (if applicable)
  - Submission of assignments (if applicable)
- **Completion Process**:
  - Admin marks training as completed
  - System calculates attendance percentage
  - System updates employee learning profile
  - System awards learning hours
  - Completion certificate generated

#### FR-5.3: Learning Hours Calculation

- Hours added to profile upon training completion
- Annual learning hours tracked (calendar year)
- Monthly breakdown available
- Hours contribute to badge eligibility

#### FR-5.4: Learning Profile Updates

- Training status updated in real-time
- Attendance records visible in profile
- Completion certificates downloadable
- Learning hours reflected in profile dashboard

---

### 3.6 Manager Features (Good-to-Have)

#### FR-6.1: Reportee Management

- Manager can view list of direct reportees
- Access to each reportee's learning profile
- View-only access (cannot edit)

#### FR-6.2: Reportee Learning Profile View

- View complete learning profile of reportees
- See tech stack and certifications
- View training history and status
- Check mandatory training completion status
- View learning hours and badges

#### FR-6.3: Mandatory Training Monitoring

- Dashboard showing mandatory training compliance
- List of reportees with pending mandatory trainings
- Deadline tracking for mandatory trainings
- Send reminders to reportees

---

### 3.7 Reporting & Analytics (Good-to-Have)

#### FR-7.1: Department-wise Reports

- **Metrics**:
  - Total trainings completed by department
  - Average learning hours per employee
  - Training participation rate
  - Mandatory training completion percentage
  - Popular training categories
- **Export**: PDF, Excel, CSV formats

#### FR-7.2: Director-wise Reports

- Training completion under each director's organization
- Team-wise learning hour comparison
- Skills gap analysis
- Training investment (hours) by team

#### FR-7.3: Mandatory Training Compliance Report

- Organization-wide mandatory training completion status
- Employee-wise pending mandatory trainings
- Overdue mandatory trainings
- Compliance percentage by department/team

#### FR-7.4: Custom Reports

- Date range selection
- Filter by department, role, training type
- Exportable in multiple formats

---

### 3.8 Gamification (Good-to-Have)

#### FR-8.1: Quizzes & Assessments

- **Quiz Creation** (Admin):
  - Multiple choice questions
  - True/False questions
  - Short answer questions
  - Set passing score threshold
- **Quiz Taking** (Employee):
  - Timed quizzes (optional)
  - Immediate score feedback
  - Correct answer review
- **Integration**: Link quizzes to specific trainings

#### FR-8.2: Learning Games

- Interactive learning modules
- Scenario-based challenges
- Points-based competitions
- Leaderboards (optional)

#### FR-8.3: Badge System

- **Bronze Badge**: 25 learning hours completed annually
- **Silver Badge**: 50 learning hours completed annually
- **Gold Badge**: 100 learning hours completed annually
- **Platinum Badge**: 150+ learning hours completed annually

#### FR-8.4: Badge Auto-Generation

- **Process**:
  - System monitors annual learning hours
  - Automatically awards badge when threshold reached
  - Badge appears in employee profile
  - Notification sent to employee
  - Badge displayed with year earned
- **Badge Display**: Visual badge icons in profile and leaderboard

#### FR-8.5: Certificate Generation

- **Automatic Generation**: Certificates auto-generated for badges
- **Certificate Contents**:
  - Employee name and ID
  - Badge level (Silver, Gold, Platinum)
  - Year earned
  - Total learning hours
  - Organization logo and signature
  - Unique certificate number
- **Format**: PDF, downloadable and printable
- **Template**: Customizable certificate template

#### FR-8.6: Leaderboard (Optional)

- Display top learners by hours
- Department-wise leaderboards
- Monthly and annual leaderboards
- Badge collection showcase

---

### 3.9 Notifications & Reminders

#### FR-9.1: Email Notifications

- Training assignment notification
- Training enrollment confirmation
- Mandatory training deadline reminder (7 days, 3 days, 1 day before)
- Training start reminder (1 day before)
- Mandatory training approval/rejection
- Badge achievement notification
- Certificate availability notification

#### FR-9.2: In-App Notifications

- Real-time notification bell icon
- Notification center with all alerts
- Mark as read functionality
- Notification categories

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

- **Page Load Time**: Maximum 3 seconds for standard pages
- **Search Response**: Maximum 2 seconds for search queries
- **Concurrent Users**: Support at least 500 concurrent users
- **Database Queries**: Optimized queries with response time < 1 second
- **Report Generation**: Large reports generated within 10 seconds

### 4.2 Scalability

- Modular architecture supporting horizontal scaling
- Database design supporting growth to 10,000+ users
- Efficient data pagination for large datasets
- Caching mechanism for frequently accessed data

### 4.3 Security Requirements

- **Authentication**: Secure password hashing (bcrypt/Argon2)
- **Authorization**: JWT-based token authentication
- **Data Protection**: HTTPS for all communications
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries/ORM
- **XSS Prevention**: Input sanitization and output encoding
- **Password Policy**: Minimum 8 characters, mix of uppercase, lowercase, numbers, special characters
- **Session Security**: Secure session management with timeout

### 4.4 Usability Requirements

- Intuitive and clean user interface
- Responsive design for desktop, tablet, and mobile
- Consistent navigation across all pages
- Clear error messages and validation feedback
- Accessibility compliance (WCAG 2.1 Level AA)
- Maximum 3 clicks to reach any feature

### 4.5 Reliability & Availability

- **Uptime**: 99% availability during business hours
- **Error Handling**: Graceful error handling with user-friendly messages
- **Data Backup**: Daily automated backups
- **Recovery**: Maximum 4-hour recovery time objective (RTO)

### 4.6 Maintainability

- Clean, well-documented code
- Modular architecture with separation of concerns
- RESTful API design
- Version control using Git
- Comprehensive README and setup documentation

### 4.7 Compatibility

- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Devices**: Desktop, laptop, tablet, mobile (responsive design)
- **Operating Systems**: Windows, macOS, Linux, iOS, Android

---

## 5. System Architecture

### 5.1 Recommended Technology Stack

#### Frontend

- **Framework**: React.js or Vue.js or Angular
- **Styling**: Tailwind CSS or Material-UI or Bootstrap
- **State Management**: Redux or Context API or Vuex
- **HTTP Client**: Axios

#### Backend

- **Language**: Node.js (Express) or Python (Django/Flask) or Java (Spring Boot)
- **API**: RESTful API architecture
- **Authentication**: JWT (JSON Web Tokens)

#### Database

- **Primary Database**: PostgreSQL or MySQL (relational data)
- **Alternative**: MongoDB (if document-based approach preferred)

#### File Storage

- Local file system or AWS S3 or similar cloud storage

#### Additional Tools

- **PDF Generation**: jsPDF or PDFKit
- **Email Service**: NodeMailer or SendGrid
- **Task Scheduler**: node-cron or Celery (for notifications)

### 5.2 Database Schema (High-Level)

#### Core Tables

- **Users**: user_id, email, password_hash, first_name, last_name, employee_id, department, role, manager_id, created_at
- **Profiles**: profile_id, user_id, tech_stack (JSON), bio, skills (JSON)
- **Certifications**: cert_id, user_id, cert_name, issuing_body, issue_date, expiry_date, document_url
- **Trainings**: training_id, title, description, category, type, duration, instructor, max_participants, start_date, end_date, status, is_mandatory, approved_by, created_by
- **Training_Sessions**: session_id, training_id, session_date, start_time, end_time, location
- **Enrollments**: enrollment_id, user_id, training_id, enrollment_date, status, assigned_by
- **Attendance**: attendance_id, enrollment_id, session_id, status, marked_by, marked_at
- **Training_Completion**: completion_id, enrollment_id, completion_date, learning_hours, certificate_url
- **Badges**: badge_id, user_id, badge_type, year_earned, hours_completed, awarded_at
- **Notifications**: notification_id, user_id, type, message, is_read, created_at

---

## 6. User Interface Requirements

### 6.1 Common UI Elements

- Navigation bar with role-based menu items
- User profile dropdown with logout option
- Notification bell icon with badge count
- Breadcrumb navigation
- Footer with links and copyright

### 6.2 Login Page

- Email/username input field
- Password input field with show/hide toggle
- "Remember Me" checkbox
- Login button
- "Forgot Password" link
- Clean, professional design with organization branding

### 6.3 Employee Dashboard

- Welcome message with user name
- Quick stats cards (Total Hours, Badges, Completed Trainings, Upcoming Trainings)
- Upcoming trainings section (next 5)
- Mandatory trainings due section
- Recent achievements/badges
- Learning hours progress chart

### 6.4 Employee Learning Profile Page

- Profile header with photo and basic info
- Tech stack section with skill tags
- Certifications section with cards
- Training history table with filters
- Learning hours statistics (annual, monthly)
- Badges showcase
- Skills matrix/competency grid

### 6.5 Training Catalog Page

- Search bar with filters
- Category sidebar
- Training cards with thumbnail, title, duration, date, enroll button
- Pagination or infinite scroll
- View toggle (grid/list view)

### 6.6 Training Detail Page

- Training banner/image
- Complete training information
- Enrollment button (if applicable)
- Training materials section
- Sessions schedule
- Enrolled participants count
- Prerequisites display

### 6.7 Admin Dashboard

- Admin-specific statistics
- Pending approvals section (for Super Admin)
- Recent trainings created
- Quick actions (Create Training, View Reports)
- System health indicators

### 6.8 Training Creation/Edit Form (Admin)

- Multi-step form or tabbed interface
- Basic Info tab
- Schedule tab
- Materials tab
- Assignment tab
- Preview before publish
- Save as draft option

### 6.9 Reports Page (Admin/Manager)

- Report type selector
- Date range picker
- Department/team filter
- Generate report button
- Export options
- Visual charts and graphs
- Data tables

### 6.10 Manager Dashboard (Good-to-Have)

- Team overview statistics
- Reportee list with learning progress
- Mandatory compliance status
- Team leaderboard
- Quick links to reportee profiles

---

## 7. API Endpoints (High-Level)

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Users & Profiles

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:id/profile` - Get user learning profile
- `POST /api/users/me/certifications` - Add certification
- `PUT /api/users/me/certifications/:id` - Update certification
- `DELETE /api/users/me/certifications/:id` - Delete certification

### Trainings

- `GET /api/trainings` - Get all trainings (with filters)
- `GET /api/trainings/:id` - Get training details
- `POST /api/trainings` - Create training (Admin)
- `PUT /api/trainings/:id` - Update training (Admin)
- `DELETE /api/trainings/:id` - Delete training (Admin)
- `POST /api/trainings/:id/approve` - Approve mandatory training (Super Admin)

### Enrollments

- `POST /api/trainings/:id/enroll` - Enroll in training
- `GET /api/enrollments/me` - Get my enrollments
- `DELETE /api/enrollments/:id` - Unenroll (if allowed)

### Attendance

- `POST /api/enrollments/:id/attendance` - Mark attendance (Admin)
- `GET /api/trainings/:id/attendance` - Get training attendance report

### Assignments

- `POST /api/trainings/:id/assign` - Assign training (Admin)
- `GET /api/assignments/me` - Get my assigned trainings

### Badges & Certificates

- `GET /api/badges/me` - Get my badges
- `POST /api/badges/check` - Check and award badges (system cron job)
- `GET /api/certificates/:badge_id` - Generate/download certificate

### Reports

- `GET /api/reports/department` - Department-wise report
- `GET /api/reports/mandatory` - Mandatory training compliance
- `GET /api/reports/custom` - Custom report with filters

### Manager

- `GET /api/manager/reportees` - Get reportee list
- `GET /api/manager/reportees/:id/profile` - Get reportee profile

### Notifications

- `GET /api/notifications/me` - Get my notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 8. Development Phases

### Phase 1: Core MVP (Must-Have)

- User authentication with 3 roles
- Employee learning profile
- Training creation and management
- Training assignment workflow
- Mandatory training approval (Super Admin)
- Training catalog and enrollment
- Attendance and completion tracking
- Basic UI for all features

### Phase 2: Enhanced Features (Good-to-Have)

- Manager role and reportee viewing
- Reporting and analytics
- Badge system (25/50/100 hours)
- Certificate generation
- Enhanced UI/UX

### Phase 3: Gamification

- Quizzes and assessments
- Learning games
- Leaderboards
- Advanced gamification elements

---

## 9. Testing Requirements

### 9.1 Unit Testing

- Test individual functions and components
- Minimum 70% code coverage
- Test all business logic

### 9.2 Integration Testing

- Test API endpoints
- Test database operations
- Test authentication flows

### 9.3 User Acceptance Testing

- Test complete user workflows
- Test all user roles
- Test edge cases and error scenarios

### 9.4 Security Testing

- Test authentication and authorization
- Test input validation
- Test for common vulnerabilities (OWASP Top 10)

---

## 10. Deployment Requirements

### 10.1 Version Control

- Code hosted on public Git repository (GitHub/GitLab/Bitbucket)
- Proper commit messages following conventions
- README with setup and deployment instructions

### 10.2 Documentation

- API documentation (Swagger/Postman collection)
- Database schema documentation
- User manual for different roles
- Installation and setup guide

### 10.3 Repository Structure

```
/project-root
  /frontend
    /src
    /public
    package.json
  /backend
    /src
    /config
    package.json
  /database
    schema.sql
    migrations/
  /docs
    API.md
    USER_MANUAL.md
  README.md
  .gitignore
```

---

## 11. Success Criteria

The L&D Portal MVP will be considered successful if:

1. All Must-Have features are fully functional
2. All user roles can perform their designated tasks
3. System handles concurrent users without performance degradation
4. Security requirements are met
5. Code is clean, documented, and hosted on public Git repository
6. Application is deployable and usable
7. User interface is intuitive and responsive

---

## 12. Assumptions and Dependencies

### Assumptions

- Users have basic computer literacy
- Internet connectivity available
- Modern web browsers used
- Email service available for notifications

### Dependencies

- Hosting environment (local/cloud)
- Email service provider
- Database server
- File storage system

---

## 13. Glossary

- **Learning Hours**: Total time spent in training sessions
- **Mandatory Training**: Training required for all or specific employees, requires completion
- **Open Training**: Training available for voluntary enrollment
- **Assigned Training**: Training specifically assigned to employees
- **Completion**: Successfully finishing a training with minimum attendance
- **Badge**: Achievement award based on learning hours milestone
- **Certificate**: Document generated for badge achievement

---

**Document End**

_This SRS provides a comprehensive blueprint for developing the L&D Portal MVP. Implementation teams should refer to this document throughout the development lifecycle and update it as requirements evolve._
