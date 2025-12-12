"""Domain models for the L&D Portal."""

from src.models.user import User, UserRole
from src.models.department import Department
from src.models.profile import Profile
from src.models.certification import Certification
from src.models.training import Training, TrainingSession, TrainingStatus
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.attendance import Attendance, AttendanceStatus
from src.models.completion import TrainingCompletion
from src.models.badge import Badge, BadgeType
from src.models.notification import Notification, NotificationType

__all__ = [
    "User",
    "UserRole",
    "Department",
    "Profile",
    "Certification",
    "Training",
    "TrainingSession",
    "TrainingStatus",
    "Enrollment",
    "EnrollmentStatus",
    "Attendance",
    "AttendanceStatus",
    "TrainingCompletion",
    "Badge",
    "BadgeType",
    "Notification",
    "NotificationType",
]
