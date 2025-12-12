"""Script to populate database with mock data for testing and development."""

import asyncio
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.db import get_engine, get_sessionmaker
from src.core.security import hash_password
from src.models.attendance import Attendance, AttendanceStatus
from src.models.badge import Badge, BadgeType
from src.models.certification import Certification
from src.models.completion import TrainingCompletion
from src.models.department import Department
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.notification import Notification, NotificationType
from src.models.profile import Profile
from src.models.training import Training, TrainingSession, TrainingStatus
from src.models.user import User, UserRole


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a database session for the script."""
    settings = get_settings()
    engine = get_engine(settings.DATABASE_URL, settings.DATABASE_ECHO)
    sessionmaker = get_sessionmaker(engine)

    async with sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    await engine.dispose()


async def clear_all_data(session: AsyncSession) -> None:
    """Clear all existing data from the database."""
    print("🧹 Clearing existing data...")

    # Use TRUNCATE with CASCADE for efficient clearing
    # Note: table names from database schema (singular, not plural)
    tables = [
        "attendance",
        "training_completions",
        "badges",
        "certifications",
        "notifications",
        "enrollments",
        "training_sessions",
        "trainings",
        "profiles",
        "users",
        "departments",
    ]

    for table in tables:
        try:
            await session.execute(
                text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
            )
        except Exception as e:
            # Table might not exist yet if migrations haven't been run
            print(f"  ⚠️  Could not truncate {table}: {str(e)[:60]}")

    await session.commit()
    print("✓ All data cleared")


async def seed_departments(session: AsyncSession) -> list[Department]:
    """Create department mock data."""
    print("📁 Seeding departments...")

    departments_data = [
        {
            "name": "Engineering",
            "description": "Software development and technical operations team",
        },
        {
            "name": "Product Management",
            "description": "Product strategy and roadmap management",
        },
        {
            "name": "Sales",
            "description": "Revenue generation and customer acquisition",
        },
        {
            "name": "Marketing",
            "description": "Brand management and customer engagement",
        },
        {
            "name": "Human Resources",
            "description": "Talent acquisition and employee development",
        },
        {
            "name": "Finance",
            "description": "Financial planning and accounting",
        },
    ]

    departments = []
    for dept_data in departments_data:
        dept = Department(**dept_data)
        session.add(dept)
        departments.append(dept)

    await session.commit()
    for dept in departments:
        await session.refresh(dept)

    print(f"✓ Created {len(departments)} departments")
    return departments


async def seed_users(
    session: AsyncSession, departments: list[Department]
) -> dict[str, list[User]]:
    """Create user mock data with different roles."""
    print("👥 Seeding users...")

    # Hash a default password for all users
    default_password = hash_password("Password123!")

    users_by_role = {
        "admins": [],
        "managers": [],
        "employees": [],
    }

    # Super Admin
    super_admin = User(
        email="admin@company.com",
        hashed_password=default_password,
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        department_id=departments[4].id,  # HR
    )
    session.add(super_admin)
    users_by_role["admins"].append(super_admin)

    # Department Managers
    managers_data = [
        ("john.smith@company.com", "John Smith", departments[0].id),  # Engineering
        ("sarah.johnson@company.com", "Sarah Johnson", departments[1].id),  # Product
        ("mike.williams@company.com", "Mike Williams", departments[2].id),  # Sales
        ("emma.brown@company.com", "Emma Brown", departments[3].id),  # Marketing
    ]

    for email, name, dept_id in managers_data:
        manager = User(
            email=email,
            hashed_password=default_password,
            full_name=name,
            role=UserRole.MANAGER,
            department_id=dept_id,
        )
        session.add(manager)
        users_by_role["managers"].append(manager)

    # Regular Employees
    employees_data = [
        # Engineering team
        ("alice.dev@company.com", "Alice Developer", departments[0].id),
        ("bob.engineer@company.com", "Bob Engineer", departments[0].id),
        ("charlie.coder@company.com", "Charlie Coder", departments[0].id),
        ("diana.tech@company.com", "Diana Tech", departments[0].id),
        # Product team
        ("eve.product@company.com", "Eve Product", departments[1].id),
        ("frank.pm@company.com", "Frank PM", departments[1].id),
        # Sales team
        ("grace.sales@company.com", "Grace Sales", departments[2].id),
        ("henry.account@company.com", "Henry Account", departments[2].id),
        ("ivy.rep@company.com", "Ivy Rep", departments[2].id),
        # Marketing team
        ("jack.marketing@company.com", "Jack Marketing", departments[3].id),
        ("kate.content@company.com", "Kate Content", departments[3].id),
        # HR team
        ("lisa.hr@company.com", "Lisa HR", departments[4].id),
        # Finance team
        ("mark.finance@company.com", "Mark Finance", departments[5].id),
    ]

    for email, name, dept_id in employees_data:
        employee = User(
            email=email,
            hashed_password=default_password,
            full_name=name,
            role=UserRole.EMPLOYEE,
            department_id=dept_id,
        )
        session.add(employee)
        users_by_role["employees"].append(employee)

    await session.commit()

    # Refresh all users
    for role_users in users_by_role.values():
        for user in role_users:
            await session.refresh(user)

    # Assign managers to employees
    eng_employees = [
        u for u in users_by_role["employees"] if u.department_id == departments[0].id
    ]
    for emp in eng_employees:
        emp.manager_id = users_by_role["managers"][0].id  # John Smith

    prod_employees = [
        u for u in users_by_role["employees"] if u.department_id == departments[1].id
    ]
    for emp in prod_employees:
        emp.manager_id = users_by_role["managers"][1].id  # Sarah Johnson

    sales_employees = [
        u for u in users_by_role["employees"] if u.department_id == departments[2].id
    ]
    for emp in sales_employees:
        emp.manager_id = users_by_role["managers"][2].id  # Mike Williams

    marketing_employees = [
        u for u in users_by_role["employees"] if u.department_id == departments[3].id
    ]
    for emp in marketing_employees:
        emp.manager_id = users_by_role["managers"][3].id  # Emma Brown

    await session.commit()

    total_users = sum(len(users) for users in users_by_role.values())
    print(
        f"✓ Created {total_users} users (1 admin, {len(users_by_role['managers'])} managers, {len(users_by_role['employees'])} employees)"
    )

    return users_by_role


async def seed_profiles(
    session: AsyncSession, users_by_role: dict[str, list[User]]
) -> None:
    """Create profile mock data for users."""
    print("📋 Seeding profiles...")

    all_users = []
    for role_users in users_by_role.values():
        all_users.extend(role_users)

    profiles_data = [
        {
            "bio": "Experienced software engineer with 10+ years in backend development",
            "skills": ["Python", "PostgreSQL", "FastAPI", "Docker"],
            "interests": ["Cloud Architecture", "API Design", "DevOps"],
        },
        {
            "bio": "Full-stack developer passionate about clean code",
            "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
            "interests": ["Frontend Development", "UI/UX", "Testing"],
        },
        {
            "bio": "Product manager focused on user experience",
            "skills": ["Product Strategy", "User Research", "Agile", "Roadmapping"],
            "interests": ["Product Design", "Customer Development", "Analytics"],
        },
        {
            "bio": "Sales professional with strong customer relationships",
            "skills": ["Salesforce", "Negotiation", "Presentations", "CRM"],
            "interests": ["Sales Strategy", "Account Management", "Networking"],
        },
    ]

    profiles = []
    for i, user in enumerate(all_users):
        profile_data = profiles_data[i % len(profiles_data)]
        profile = Profile(
            user_id=user.id,
            bio=profile_data["bio"],
            skills=profile_data["skills"],
            interests=profile_data["interests"],
            phone=f"+1-555-{1000 + i:04d}",
            linkedin_url=f"https://linkedin.com/in/{user.email.split('@')[0]}",
        )
        session.add(profile)
        profiles.append(profile)

    await session.commit()
    print(f"✓ Created {len(profiles)} profiles")


async def seed_trainings(session: AsyncSession, admin: User) -> list[Training]:
    """Create training mock data."""
    print("📚 Seeding trainings...")

    trainings_data = [
        {
            "title": "Python Advanced Programming",
            "description": "Deep dive into advanced Python concepts including decorators, generators, context managers, and metaclasses",
            "category": "Technical",
            "duration_hours": 16.0,
            "max_participants": 20,
            "is_mandatory": False,
            "status": TrainingStatus.APPROVED,
            "prerequisites": ["Basic Python knowledge", "OOP concepts"],
            "learning_objectives": [
                "Master advanced Python features",
                "Write efficient Python code",
                "Understand Python internals",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=30),
        },
        {
            "title": "AWS Cloud Architecture",
            "description": "Comprehensive guide to building scalable applications on AWS",
            "category": "Cloud",
            "duration_hours": 24.0,
            "max_participants": 15,
            "is_mandatory": False,
            "status": TrainingStatus.APPROVED,
            "prerequisites": ["Basic cloud concepts", "Linux fundamentals"],
            "learning_objectives": [
                "Design scalable architectures",
                "Implement AWS best practices",
                "Manage cloud infrastructure",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=25),
        },
        {
            "title": "Leadership Fundamentals",
            "description": "Essential skills for first-time managers and team leads",
            "category": "Leadership",
            "duration_hours": 12.0,
            "max_participants": 25,
            "is_mandatory": True,
            "status": TrainingStatus.APPROVED,
            "prerequisites": [],
            "learning_objectives": [
                "Develop leadership skills",
                "Manage team dynamics",
                "Provide effective feedback",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=20),
        },
        {
            "title": "Sales Techniques Masterclass",
            "description": "Modern sales strategies and customer engagement techniques",
            "category": "Sales",
            "duration_hours": 8.0,
            "max_participants": 30,
            "is_mandatory": False,
            "status": TrainingStatus.APPROVED,
            "prerequisites": ["Basic sales experience"],
            "learning_objectives": [
                "Master consultative selling",
                "Handle objections effectively",
                "Close deals confidently",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=15),
        },
        {
            "title": "Data Privacy and Security",
            "description": "Understanding GDPR, data protection, and security best practices",
            "category": "Compliance",
            "duration_hours": 4.0,
            "max_participants": 50,
            "is_mandatory": True,
            "status": TrainingStatus.APPROVED,
            "prerequisites": [],
            "learning_objectives": [
                "Understand privacy regulations",
                "Implement security measures",
                "Handle data responsibly",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=10),
        },
        {
            "title": "Machine Learning Fundamentals",
            "description": "Introduction to ML concepts, algorithms, and practical applications",
            "category": "Technical",
            "duration_hours": 20.0,
            "max_participants": 18,
            "is_mandatory": False,
            "status": TrainingStatus.SCHEDULED,
            "prerequisites": ["Python programming", "Basic statistics"],
            "learning_objectives": [
                "Understand ML algorithms",
                "Build ML models",
                "Deploy ML solutions",
            ],
            "approved_by_id": admin.id,
            "approved_at": datetime.utcnow() - timedelta(days=5),
        },
        {
            "title": "Agile Project Management",
            "description": "Scrum, Kanban, and agile methodologies for modern teams",
            "category": "Project Management",
            "duration_hours": 16.0,
            "max_participants": 25,
            "is_mandatory": False,
            "status": TrainingStatus.PENDING_APPROVAL,
            "prerequisites": [],
            "learning_objectives": [
                "Implement agile frameworks",
                "Facilitate agile ceremonies",
                "Manage agile teams",
            ],
        },
    ]

    trainings = []
    for training_data in trainings_data:
        training = Training(**training_data)
        session.add(training)
        trainings.append(training)

    await session.commit()
    for training in trainings:
        await session.refresh(training)

    print(f"✓ Created {len(trainings)} trainings")
    return trainings


async def seed_training_sessions(
    session: AsyncSession, trainings: list[Training]
) -> list[TrainingSession]:
    """Create training session mock data."""
    print("📅 Seeding training sessions...")

    sessions = []

    # Create multiple sessions for approved trainings
    approved_trainings = [
        t
        for t in trainings
        if t.status in [TrainingStatus.APPROVED, TrainingStatus.SCHEDULED]
    ]

    for training in approved_trainings[:5]:  # First 5 approved trainings
        # Past session (completed)
        past_session = TrainingSession(
            training_id=training.id,
            session_date=date.today() - timedelta(days=30),
            start_time="09:00",
            end_time="17:00",
            location="Conference Room A",
            instructor_name="Dr. Jane Expert",
            max_participants=training.max_participants,
        )
        session.add(past_session)
        sessions.append(past_session)

        # Upcoming session
        upcoming_session = TrainingSession(
            training_id=training.id,
            session_date=date.today() + timedelta(days=14),
            start_time="10:00",
            end_time="18:00",
            location="Conference Room B",
            instructor_name="Prof. John Instructor",
            max_participants=training.max_participants,
        )
        session.add(upcoming_session)
        sessions.append(upcoming_session)

    await session.commit()
    for sess in sessions:
        await session.refresh(sess)

    print(f"✓ Created {len(sessions)} training sessions")
    return sessions


async def seed_enrollments(
    session: AsyncSession,
    users_by_role: dict[str, list[User]],
    trainings: list[Training],
    training_sessions: list[TrainingSession],
) -> list[Enrollment]:
    """Create enrollment mock data."""
    print("📝 Seeding enrollments...")

    employees = users_by_role["employees"]
    enrollments = []

    # Enroll employees in various trainings
    for i, employee in enumerate(employees[:8]):  # First 8 employees
        # Completed enrollment
        if i < 5 and training_sessions:
            past_session = [
                s for s in training_sessions if s.session_date < date.today()
            ][0]
            enrollment = Enrollment(
                user_id=employee.id,
                training_id=past_session.training_id,
                session_id=past_session.id,
                status=EnrollmentStatus.COMPLETED,
                enrolled_at=datetime.utcnow() - timedelta(days=45),
                completed_at=datetime.utcnow() - timedelta(days=30),
            )
            session.add(enrollment)
            enrollments.append(enrollment)

        # Active enrollment
        if i < 6 and len(training_sessions) > 1:
            upcoming_session = [
                s for s in training_sessions if s.session_date > date.today()
            ][0]
            enrollment = Enrollment(
                user_id=employee.id,
                training_id=upcoming_session.training_id,
                session_id=upcoming_session.id,
                status=EnrollmentStatus.ENROLLED,
                enrolled_at=datetime.utcnow() - timedelta(days=5),
            )
            session.add(enrollment)
            enrollments.append(enrollment)

    await session.commit()
    for enr in enrollments:
        await session.refresh(enr)

    print(f"✓ Created {len(enrollments)} enrollments")
    return enrollments


async def seed_completions(
    session: AsyncSession,
    enrollments: list[Enrollment],
    trainings: list[Training],
) -> list[TrainingCompletion]:
    """Create completion records for completed enrollments."""
    print("✅ Seeding completions...")

    completed_enrollments = [
        e for e in enrollments if e.status == EnrollmentStatus.COMPLETED
    ]
    completions = []

    # Create a training lookup dictionary
    training_lookup = {t.id: t for t in trainings}

    for enrollment in completed_enrollments:
        training = training_lookup.get(enrollment.training_id)
        learning_hours = training.duration_hours if training else 8.0

        completion = TrainingCompletion(
            user_id=enrollment.user_id,
            training_id=enrollment.training_id,
            enrollment_id=enrollment.id,
            completed_at=enrollment.completed_at or datetime.utcnow(),
            learning_hours=learning_hours,
            attendance_percentage=95.0 + (len(completions) % 5),  # 95-100%
            assessment_score=85.0 + (len(completions) % 15),  # Scores between 85-100
            passed=True,
            certificate_issued=True,
            certificate_url=f"https://certs.company.com/{enrollment.id}",
        )
        session.add(completion)
        completions.append(completion)

    await session.commit()
    print(f"✓ Created {len(completions)} completions")
    return completions


async def seed_attendance(
    session: AsyncSession,
    enrollments: list[Enrollment],
    training_sessions: list[TrainingSession],
) -> list[Attendance]:
    """Create attendance records."""
    print("📊 Seeding attendance records...")

    completed_enrollments = [
        e for e in enrollments if e.status == EnrollmentStatus.COMPLETED
    ]
    attendance_records = []

    for enrollment in completed_enrollments:
        if enrollment.session_id:
            # Find the training session to get its date
            training_session = next(
                (s for s in training_sessions if s.id == enrollment.session_id), None
            )
            attendance_date = (
                training_session.session_date
                if training_session
                else date.today() - timedelta(days=30)
            )

            attendance = Attendance(
                user_id=enrollment.user_id,
                session_id=enrollment.session_id,
                enrollment_id=enrollment.id,
                attendance_date=attendance_date,
                status=AttendanceStatus.PRESENT,
                hours_attended=8.0,
                notes="Active participation throughout the session",
            )
            session.add(attendance)
            attendance_records.append(attendance)

    await session.commit()
    print(f"✓ Created {len(attendance_records)} attendance records")
    return attendance_records


async def seed_certifications(
    session: AsyncSession,
    users_by_role: dict[str, list[User]],
) -> list[Certification]:
    """Create certification mock data."""
    print("🏆 Seeding certifications...")

    employees = users_by_role["employees"]
    certifications = []

    cert_data = [
        ("AWS Certified Solutions Architect", "Amazon Web Services", 365),
        ("Python Professional Certification", "Python Institute", 730),
        ("Certified Scrum Master", "Scrum Alliance", 730),
        ("Google Cloud Professional", "Google", 365),
    ]

    for i, employee in enumerate(employees[:6]):
        cert_name, org, days_valid = cert_data[i % len(cert_data)]
        issue_dt = date.today() - timedelta(days=180)

        cert = Certification(
            user_id=employee.id,
            name=cert_name,
            issuing_organization=org,
            issue_date=issue_dt,
            expiry_date=issue_dt + timedelta(days=days_valid),
            credential_id=f"CERT-{1000 + i}",
            credential_url=f"https://certs.example.com/{1000 + i}",
        )
        session.add(cert)
        certifications.append(cert)

    await session.commit()
    print(f"✓ Created {len(certifications)} certifications")
    return certifications


async def seed_badges(
    session: AsyncSession,
    users_by_role: dict[str, list[User]],
) -> list[Badge]:
    """Create badge mock data."""
    print("🎖️ Seeding badges...")

    employees = users_by_role["employees"]
    badges = []

    badge_types = [BadgeType.BRONZE, BadgeType.SILVER, BadgeType.GOLD]

    for i, employee in enumerate(employees[:7]):
        badge_type = badge_types[i % len(badge_types)]
        hours = 0
        trainings = 0

        if badge_type == BadgeType.BRONZE:
            hours = 12.0
            trainings = 3
        elif badge_type == BadgeType.SILVER:
            hours = 26.0
            trainings = 6
        elif badge_type == BadgeType.GOLD:
            hours = 55.0
            trainings = 12

        badge = Badge(
            user_id=employee.id,
            badge_type=badge_type,
            year_earned=2024,
            hours_completed=hours,
            trainings_completed=trainings,
            awarded_at=datetime.utcnow().isoformat(),
        )
        session.add(badge)
        badges.append(badge)

    await session.commit()
    print(f"✓ Created {len(badges)} badges")
    return badges


async def seed_notifications(
    session: AsyncSession,
    users_by_role: dict[str, list[User]],
    trainings: list[Training],
) -> list[Notification]:
    """Create notification mock data."""
    print("🔔 Seeding notifications...")

    employees = users_by_role["employees"]
    notifications = []

    # Training assigned notifications
    for i, employee in enumerate(employees[:5]):
        notif = Notification(
            user_id=employee.id,
            notification_type=NotificationType.TRAINING_ASSIGNED,
            title="New Training Assigned",
            message=f"You have been assigned to: {trainings[i % len(trainings)].title}",
            is_read=i % 2 == 0,  # Some read, some unread
        )
        session.add(notif)
        notifications.append(notif)

    # Badge earned notifications
    for i, employee in enumerate(employees[:4]):
        notif = Notification(
            user_id=employee.id,
            notification_type=NotificationType.BADGE_EARNED,
            title="Badge Earned!",
            message=f"Congratulations! You've earned a {['Bronze', 'Silver', 'Gold'][i % 3]} badge.",
            is_read=True,
        )
        session.add(notif)
        notifications.append(notif)

    # Session reminder notifications
    for i, employee in enumerate(employees[:3]):
        notif = Notification(
            user_id=employee.id,
            notification_type=NotificationType.SESSION_REMINDER,
            title="Upcoming Training Session",
            message=f"Reminder: Your training session for {trainings[0].title} is tomorrow.",
            is_read=False,
        )
        session.add(notif)
        notifications.append(notif)

    await session.commit()
    print(f"✓ Created {len(notifications)} notifications")
    return notifications


async def main():
    """Main function to seed all mock data."""
    print("\n" + "=" * 60)
    print("🌱 Starting Database Mock Data Seeding")
    print("=" * 60 + "\n")

    async with get_db_session() as session:
        # Clear existing data
        await clear_all_data(session)

        print()

        # Seed data in order of dependencies
        departments = await seed_departments(session)
        users_by_role = await seed_users(session, departments)
        await seed_profiles(session, users_by_role)

        admin = users_by_role["admins"][0]
        trainings = await seed_trainings(session, admin)
        training_sessions = await seed_training_sessions(session, trainings)

        enrollments = await seed_enrollments(
            session, users_by_role, trainings, training_sessions
        )
        completions = await seed_completions(session, enrollments, trainings)
        attendance = await seed_attendance(session, enrollments, training_sessions)

        certifications = await seed_certifications(session, users_by_role)
        badges = await seed_badges(session, users_by_role)
        notifications = await seed_notifications(session, users_by_role, trainings)

        print("\n" + "=" * 60)
        print("✅ Mock Data Seeding Complete!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"  • Departments: {len(departments)}")
        print(f"  • Users: {sum(len(users) for users in users_by_role.values())}")
        print(f"  • Trainings: {len(trainings)}")
        print(f"  • Training Sessions: {len(training_sessions)}")
        print(f"  • Enrollments: {len(enrollments)}")
        print(f"  • Completions: {len(completions)}")
        print(f"  • Attendance Records: {len(attendance)}")
        print(f"  • Certifications: {len(certifications)}")
        print(f"  • Badges: {len(badges)}")
        print(f"  • Notifications: {len(notifications)}")
        print("\n🔑 Default credentials:")
        print("  Email: admin@company.com")
        print("  Password: Password123!")
        print("  (All users have the same password)")
        print("\n")


if __name__ == "__main__":
    asyncio.run(main())
