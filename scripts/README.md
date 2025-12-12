# Scripts

This directory contains utility scripts for the L&D Portal application.

## Available Scripts

### seed_mock_data.py

Populates the database with comprehensive mock data for testing and development purposes.

**What it creates:**
- 6 departments (Engineering, Product, Sales, Marketing, HR, Finance)
- 18 users with different roles (1 admin, 4 managers, 13 employees)
- User profiles with skills and interests
- 7 training programs with various statuses
- 10 training sessions (past and upcoming)
- Multiple enrollments, completions, and attendance records
- Certifications and badges
- Notifications

**Usage:**

```bash
# From the project root directory
python -m scripts.seed_mock_data
```

**Default Login Credentials:**
- Email: `admin@company.com`
- Password: `Password123!`
- All users share the same password for testing

**Note:** 
- This script will **clear all existing data** before seeding. Use with caution in production environments!
- You may see DeprecationWarnings about `datetime.utcnow()` - these are harmless and the script will complete successfully

**Other Users:**
- `john.smith@company.com` - Engineering Manager
- `sarah.johnson@company.com` - Product Manager
- `mike.williams@company.com` - Sales Manager
- `emma.brown@company.com` - Marketing Manager
- `alice.dev@company.com` - Software Engineer
- `bob.engineer@company.com` - Software Engineer
- `grace.sales@company.com` - Sales Rep
- And more...
