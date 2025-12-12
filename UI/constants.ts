import { Training, TrainingType, TrainingStatus, UserRole, CurrentUser, BadgeType, EnrollmentStatus } from './types';

export const MOCK_TRAININGS: Training[] = [
  {
    id: 't1',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including HOCs, Render Props, and Custom Hooks. This comprehensive course takes you beyond the basics and dives deep into professional application architecture.',
    category: 'Technical',
    type: TrainingType.ONLINE,
    duration_hours: 12,
    instructor: 'Sarah Jenkins',
    start_date: '2025-01-15',
    status: TrainingStatus.PUBLISHED,
    is_mandatory: false,
    image: 'https://picsum.photos/400/225?random=1',
    enrolled_count: 45,
    max_participants: 100,
    prerequisites: ['Basic JavaScript knowledge', 'React Fundamentals'],
    learning_outcomes: ['Build reusable components', 'Manage complex state', 'Optimize performance'],
    modules: [
      {
        id: 'm1',
        title: 'Component Design Patterns',
        lessons: [
          { id: 'l1', title: 'Introduction to Patterns', type: 'VIDEO', duration_minutes: 15, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { id: 'l2', title: 'Higher Order Components', type: 'VIDEO', duration_minutes: 25, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
          { id: 'l3', title: 'Render Props vs Hooks', type: 'TEXT', duration_minutes: 10, content_text: '## Render Props vs Hooks\n\nHistorically, render props were used to share logic...' }
        ]
      },
      {
        id: 'm2',
        title: 'Performance Optimization',
        lessons: [
          { id: 'l4', title: 'React.memo and useMemo', type: 'VIDEO', duration_minutes: 20, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
          { id: 'l5', title: 'Code Splitting', type: 'VIDEO', duration_minutes: 15, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
          { 
            id: 'l6', 
            title: 'Optimization Quiz', 
            type: 'QUIZ', 
            duration_minutes: 10,
            questions: [
              {
                id: 'q1',
                text: 'Which hook should be used to memorize a complex calculation?',
                options: ['useEffect', 'useMemo', 'useCallback', 'useState'],
                correctAnswer: 1
              },
              {
                id: 'q2',
                text: 'What is the primary purpose of React.memo?',
                options: [
                  'To cache component state',
                  'To memorize functions',
                  'To prevent unnecessary re-renders of functional components',
                  'To optimize CSS rendering'
                ],
                correctAnswer: 2
              },
              {
                id: 'q3',
                text: 'When using code-splitting, which component is used to handle the loading state?',
                options: ['Suspense', 'Await', 'Loader', 'AsyncComponent'],
                correctAnswer: 0
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 't2',
    title: 'Workplace Safety Compliance',
    description: 'Mandatory annual safety training for all employees.',
    category: 'Compliance',
    type: TrainingType.ONLINE,
    duration_hours: 2,
    instructor: 'Compliance Team',
    start_date: '2024-12-01',
    status: TrainingStatus.PUBLISHED,
    is_mandatory: true,
    image: 'https://picsum.photos/400/225?random=2',
    enrolled_count: 342,
    max_participants: 1000,
    modules: [
       {
         id: 'm1',
         title: 'Office Safety',
         lessons: [
           { id: 'l1', title: 'Emergency Exits', type: 'VIDEO', duration_minutes: 10, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
           { id: 'l2', title: 'Fire Safety', type: 'VIDEO', duration_minutes: 15, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }
         ]
       }
    ]
  },
  {
    id: 't3',
    title: 'Leadership 101: Managing Teams',
    description: 'Core principles of effective team management and conflict resolution.',
    category: 'Leadership',
    type: TrainingType.WORKSHOP,
    duration_hours: 8,
    instructor: 'Dr. Alan Grant',
    start_date: '2025-02-10',
    status: TrainingStatus.PUBLISHED,
    is_mandatory: false,
    image: 'https://picsum.photos/400/225?random=3',
    enrolled_count: 12,
    max_participants: 25,
  },
  {
    id: 't4',
    title: 'Effective Communication',
    description: 'Improve your verbal and written communication skills.',
    category: 'Soft Skills',
    type: TrainingType.WEBINAR,
    duration_hours: 4,
    instructor: 'Emily Chen',
    start_date: '2025-01-20',
    status: TrainingStatus.PUBLISHED,
    is_mandatory: false,
    image: 'https://picsum.photos/400/225?random=4',
    enrolled_count: 88,
    max_participants: 200,
  },
  {
    id: 't5',
    title: 'Cybersecurity Awareness',
    description: 'Protect yourself and the company from digital threats.',
    category: 'Compliance',
    type: TrainingType.ONLINE,
    duration_hours: 3,
    instructor: 'IT Security',
    start_date: '2025-01-05',
    status: TrainingStatus.PUBLISHED,
    is_mandatory: true,
    image: 'https://picsum.photos/400/225?random=5',
    enrolled_count: 150,
    max_participants: 500,
  },
  // Pending Trainings for Super Admin Approval
  {
    id: 'pending1',
    title: 'Advanced Security Protocols',
    description: 'In-depth security training for senior engineers.',
    category: 'Technical',
    type: TrainingType.ONLINE,
    duration_hours: 4,
    instructor: 'SecOps Team',
    start_date: '2025-03-01',
    status: TrainingStatus.PENDING_APPROVAL,
    is_mandatory: true,
    enrolled_count: 0,
    max_participants: 50,
    image: 'https://picsum.photos/400/225?random=6',
    modules: [
        {
        id: 'pm1',
        title: 'Network Security',
        lessons: [
          { id: 'pl1', title: 'Firewall Config', type: 'VIDEO', duration_minutes: 20, content_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
        ]
      }
    ]
  },
  {
    id: 'pending2',
    title: 'Q1 Compliance Update',
    description: 'Quarterly compliance check for all staff.',
    category: 'Compliance',
    type: TrainingType.ONLINE,
    duration_hours: 1,
    instructor: 'Legal Dept',
    start_date: '2025-03-10',
    status: TrainingStatus.PENDING_APPROVAL,
    is_mandatory: true,
    enrolled_count: 0,
    max_participants: 1000,
    image: 'https://picsum.photos/400/225?random=7',
    modules: []
  }
];

const BASE_USER = {
  id: 'u1',
  email: 'alex.j@company.com',
  first_name: 'Alex',
  last_name: 'Johnson',
  department_id: 'd1',
  department_name: 'Engineering',
  job_title: 'Senior Frontend Engineer',
  avatar: 'https://picsum.photos/100/100?random=10',
  bio: 'Passionate about building great UIs.',
  skills: [
    { name: 'React', proficiency: 'EXPERT' },
    { name: 'TypeScript', proficiency: 'ADVANCED' },
    { name: 'Node.js', proficiency: 'INTERMEDIATE' }
  ],
  badges: [
    {
      id: 'b1',
      user_id: 'u1',
      badge_type: BadgeType.BRONZE,
      year_earned: 2024,
      hours_completed: 25,
      awarded_at: '2024-12-01',
      name: 'Quick Learner',
      icon: '🥉'
    }
  ],
  certifications: [
    {
      id: 'c1',
      name: 'AWS Certified Developer',
      issuing_body: 'Amazon Web Services',
      issue_date: '2023-06-15',
      expiry_date: '2026-06-15',
    },
  ],
  learning_hours: {
    total: 124,
    annual: 68,
    monthly_breakdown: {
      '2025-01': 10,
      '2025-02': 15,
      '2025-03': 5
    }
  },
  training_history: [
    { training_id: 't1', title: 'Advanced React Patterns', status: EnrollmentStatus.IN_PROGRESS },
    { training_id: 't2', title: 'Workplace Safety Compliance', status: EnrollmentStatus.COMPLETED, completion_date: '2024-12-15' },
    { training_id: 't5', title: 'Cybersecurity Awareness', status: EnrollmentStatus.ENROLLED }
  ]
} as any;

export const CURRENT_USER_PROFILE: CurrentUser = {
  ...BASE_USER,
  role: UserRole.EMPLOYEE,
};

export const MANAGER_USER_PROFILE: CurrentUser = {
  ...BASE_USER,
  id: 'u3',
  first_name: 'Sarah',
  last_name: 'Connor',
  email: 'sarah.c@company.com',
  role: UserRole.MANAGER,
  job_title: 'Engineering Manager',
  avatar: 'https://picsum.photos/100/100?random=11',
};

export const ADMIN_USER_PROFILE: CurrentUser = {
  ...BASE_USER,
  id: 'u2',
  first_name: 'Morgan',
  last_name: 'Smith',
  email: 'morgan.s@company.com',
  role: UserRole.ADMIN,
  department_name: 'Human Resources',
  job_title: 'L&D Coordinator',
  avatar: 'https://picsum.photos/100/100?random=12',
};

export const SUPER_ADMIN_USER_PROFILE: CurrentUser = {
  ...BASE_USER,
  id: 'u4',
  first_name: 'Nick',
  last_name: 'Fury',
  email: 'nick.f@company.com',
  role: UserRole.SUPER_ADMIN,
  department_name: 'Operations',
  job_title: 'Director of L&D',
  avatar: 'https://picsum.photos/100/100?random=13',
};
