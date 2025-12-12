import { APP_CONFIG } from '../config';
import {
  Training,
  CurrentUser,
  UserRole,
  TrainingStatus,
  EnrollmentStatus,
  TrainingType
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper to get token
const getToken = () => localStorage.getItem('access_token');
const setToken = (token: string) => localStorage.setItem('access_token', token);
const removeToken = () => localStorage.removeItem('access_token');

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      // Optionally redirect to login or handle session expiry
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.statusText}`);
  }
  return response.json();
}

// Helper to simulate network delay
const delay = (ms: number = APP_CONFIG.SIMULATE_DELAY_MS) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<CurrentUser> => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);

      // Fetch full user profile after login
      return api.auth.getMe();
    },

    register: async (data: any): Promise<CurrentUser> => {
      // Note: Backend expects query params? No, let's check auth.py. 
      // It expects query params: email, password, full_name. 
      // Wait, usually register is a body. Let's check auth.py again.

      // Actually, let's just fix the backend to accept body if it doesn't, or pass params.
      // The backend definition:
      // async def register(
      //     email: str,
      //     password: str,
      //     full_name: str,
      // ...
      // These are query params by default in FastAPI.

      // Let's construct the URL for now.
      const query = new URLSearchParams({
        email: data.email,
        password: data.password,
        full_name: data.full_name
      }).toString();

      const response = await fetch(`${API_BASE_URL}/auth/register?${query}`, { method: 'POST' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const newUser = await response.json();

      return {
        id: newUser.id,
        user_id: newUser.id,
        email: newUser.email,
        first_name: newUser.full_name.split(' ')[0],
        last_name: newUser.full_name.split(' ').slice(1).join(' '),
        role: newUser.role as UserRole,
        department_id: newUser.department_id || 'dept-1',
        learning_hours: { total: 0, annual: 0, monthly_breakdown: {} },
        badges: [],
        certifications: [],
        training_history: [],
        skills: [],
        bio: '',
      } as unknown as CurrentUser;
    },

    getMe: async (): Promise<CurrentUser> => {
      const user = await fetchApi<any>('/users/me');
      const userId = user.id;

      // Parallel fetch for performance
      const [enrollments, learningHours, badges, profile, certifications] = await Promise.all([
        api.enrollments.getUserEnrollments(userId).catch(() => []),
        api.analytics.getUserLearningHours(userId).catch(() => null),
        api.badges.getUserBadges(userId).catch(() => []),
        fetchApi<any>(`/profiles/${userId}`).catch(() => ({})),
        api.certifications.getUserCertifications(userId).catch(() => [])
      ]);

      // Fetch department if exists
      let departmentName = undefined;
      if (user.department_id) {
        try {
          const dept = await api.departments.get(user.department_id);
          departmentName = dept.name;
        } catch (e) {
          console.warn("Failed to fetch department", e);
        }
      }

      // Process learning hours
      const defaultLearningHours = {
        total: 0,
        annual: 0,
        monthly_breakdown: {}
      };

      let processedHours = defaultLearningHours;
      if (learningHours) {
        processedHours = {
          total: learningHours.overall_total_hours,
          annual: learningHours.overall_total_hours, // Simplified
          monthly_breakdown: learningHours.years.reduce((acc: any, curr: any) => {
            acc[`${curr.year}-01`] = curr.total_hours;
            return acc;
          }, {})
        };
      }

      return {
        id: user.id,
        user_id: user.id,
        email: user.email,
        first_name: user.full_name.split(' ')[0],
        last_name: user.full_name.split(' ').slice(1).join(' '),
        role: user.role as UserRole,
        department_id: user.department_id || '',
        department_name: departmentName,
        job_title: profile.bio ? profile.bio.split('\n')[0] : 'Employee',
        avatar: `https://ui-avatars.com/api/?name=${user.full_name}&background=random`,
        bio: profile.bio,
        phone: profile.phone,
        skills: (profile.skills || []).map((s: string) => ({ name: s, proficiency: 'INTERMEDIATE' })),
        badges: badges,
        certifications: certifications.map((c: any) => ({
          id: c.id,
          name: c.name,
          issuing_body: c.issuing_organization,
          issue_date: c.issue_date,
          expiry_date: c.expiry_date
        })),
        learning_hours: processedHours,
        streak_count: profile.streak_count || 0,
        training_history: enrollments
      } as unknown as CurrentUser;
    },

    logout: () => {
      removeToken();
    }
  },

  users: {
    get: async (userId: string): Promise<CurrentUser | undefined> => {
      try {
        const user = await fetchApi<any>(`/users/${userId}`);

        // Parallel fetch for performance
        const [enrollments, learningHours, badges] = await Promise.all([
          api.enrollments.getUserEnrollments(userId).catch(() => []),
          api.analytics.getUserLearningHours(userId).catch(() => null),
          api.badges.getUserBadges(userId).catch(() => [])
        ]);

        // Process learning hours
        const defaultLearningHours = {
          total: 0,
          annual: 0,
          monthly_breakdown: {}
        };

        let processedHours = defaultLearningHours;
        if (learningHours) {
          processedHours = {
            total: learningHours.overall_total_hours,
            annual: learningHours.overall_total_hours,
            monthly_breakdown: learningHours.years.reduce((acc: any, curr: any) => {
              acc[`${curr.year}-01`] = curr.total_hours;
              return acc;
            }, {})
          };
        }

        return {
          id: user.id,
          user_id: user.id,
          email: user.email,
          first_name: user.full_name.split(' ')[0],
          last_name: user.full_name.split(' ').slice(1).join(' '),
          role: user.role as UserRole,
          department_id: user.department_id || 'dept-1',
          department_name: 'Engineering',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          learning_hours: processedHours,
          badges: badges,
          certifications: [],
          training_history: enrollments,
          skills: [],
        } as unknown as CurrentUser;
      } catch (e) {
        console.warn("Failed to fetch user from backend", e);
        return undefined;
      }
    },
    updateProfile: async (userId: string, updates: Partial<CurrentUser>): Promise<CurrentUser> => {
      // 1. Update Profile (bio, phone, etc.)
      await fetchApi<any>(`/profiles/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          bio: updates.bio,
          phone: updates.phone,
          // Map other fields if needed
        }),
      });

      // 2. Update User (name, email, etc.)
      if (updates.first_name || updates.last_name || updates.email) {
        const fullName = updates.first_name && updates.last_name
          ? `${updates.first_name} ${updates.last_name}`
          : undefined;

        await fetchApi<any>(`/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: fullName,
            email: updates.email
          })
        });
      }

      // Return merged updates for now as we don't fetch full user here
      return { ...updates } as CurrentUser;
    }
  },

  departments: {
    get: async (id: string) => {
      return fetchApi<any>(`/departments/${id}`);
    }
  },

  certifications: {
    getUserCertifications: async (userId: string) => {
      return fetchApi<any[]>(`/certifications/user/${userId}`);
    }
  },

  trainings: {
    list: async (filters?: { category?: string; status?: TrainingStatus }): Promise<Training[]> => {
      try {
        const response = await fetchApi<{ items: any[], total: number }>(`/trainings?limit=100${filters?.category && filters.category !== 'All' ? `&category=${filters.category}` : ''}`);

        let trainings = response.items.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || 'No description',
          category: t.category || 'General',
          type: t.type as TrainingType,
          duration_hours: t.duration_minutes ? Math.round(t.duration_minutes / 60) : 0,
          instructor: t.instructor_name || 'Unknown',
          start_date: t.start_date || new Date().toISOString(),
          status: t.status as TrainingStatus,
          is_mandatory: t.is_mandatory,
          enrolled_count: 0, // Default
          max_participants: t.max_participants || 100, // Default
          image: t.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60', // Default image
          modules: t.modules,
          prerequisites: t.prerequisites,
          learning_outcomes: t.learning_objectives,
        }));

        if (filters?.status) {
          trainings = trainings.filter(t => t.status === filters.status);
        }

        return trainings;
      } catch (e) {
        console.error("Failed to list trainings", e);
        return [];
      }
    },

    get: async (id: string): Promise<Training | undefined> => {
      try {
        const t = await fetchApi<any>(`/trainings/${id}`);
        return {
          id: t.id,
          title: t.title,
          description: t.description || 'No description',
          category: t.category || 'General',
          type: t.type as TrainingType,
          duration_hours: t.duration_minutes ? Math.round(t.duration_minutes / 60) : 0,
          instructor: t.instructor_name || 'Unknown',
          start_date: t.start_date || new Date().toISOString(),
          status: t.status as TrainingStatus,
          is_mandatory: t.is_mandatory,
          enrolled_count: 0,
          max_participants: t.max_participants || 100,
          image: t.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          modules: t.modules,
          prerequisites: t.prerequisites,
          learning_outcomes: t.learning_objectives,
        };
      } catch (e) {
        console.error(`Failed to get training ${id}`, e);
        return undefined;
      }
    },

    create: async (training: Training): Promise<Training> => {
      const response = await fetchApi<any>('/trainings', {
        method: 'POST',
        body: JSON.stringify({
          title: training.title,
          description: training.description,
          category: training.category,
          duration_hours: training.duration_hours,
          type: training.type,
          instructor_id: "00000000-0000-0000-0000-000000000000", // Default or current user
          start_date: training.start_date,
          end_date: new Date(new Date(training.start_date!).getTime() + (training.duration_hours || 1) * 3600000).toISOString(),
          is_mandatory: training.is_mandatory,
          max_participants: training.max_participants
        }),
      });

      return { ...training, id: response.id } as Training;
    },

    update: async (id: string, updates: Partial<Training>): Promise<Training> => {
      const response = await fetchApi<any>(`/trainings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          duration_hours: updates.duration_hours,
          type: updates.type,
          start_date: updates.start_date,
          is_mandatory: updates.is_mandatory,
          max_participants: updates.max_participants
        }),
      });

      // We need to fetch the full object again or merge
      return { ...updates, id } as Training;
    },

    delete: async (id: string): Promise<void> => {
      await fetchApi<any>(`/trainings/${id}`, {
        method: 'DELETE'
      });
    },

    submit: async (id: string): Promise<Training> => {
      const response = await fetchApi<any>(`/trainings/${id}/submit`, {
        method: 'PUT'
      });
      // Return a partial training object or fetch full
      return {
        id: response.id,
        title: response.title,
        status: response.status as TrainingStatus,
      } as Training;
    },

    approve: async (id: string): Promise<Training> => {
      const response = await fetchApi<any>(`/trainings/${id}/approve`, {
        method: 'PUT'
      });
      return {
        id: response.id,
        title: response.title,
        status: response.status as TrainingStatus,
      } as Training;
    },

    reject: async (id: string, reason: string): Promise<Training> => {
      const response = await fetchApi<any>(`/trainings/${id}/reject?rejection_reason=${encodeURIComponent(reason)}`, {
        method: 'PUT'
      });
      return {
        id: response.id,
        title: response.title,
        status: response.status as TrainingStatus,
      } as Training;
    },
  },

  enrollments: {
    enroll: async (userId: string, trainingId: string): Promise<void> => {
      await fetchApi(`/enrollments?training_id=${trainingId}`, {
        method: 'POST',
      });
    },

    getUserEnrollments: async (userId: string) => {
      try {
        const response = await fetchApi<{ items: any[] }>(`/enrollments/user/${userId}`);
        return response.items.map(e => ({
          training_id: e.training_id,
          title: e.title || 'Unknown Training',
          status: e.status as EnrollmentStatus,
          completion_date: undefined,
          progress: e.completion_percentage
        }));
      } catch (e) {
        console.error("Failed to get enrollments", e);
        return [];
      }
    }
  },

  badges: {
    getUserBadges: async (userId: string) => {
      try {
        const response = await fetchApi<{ items: any[] }>(`/badges/user/${userId}`);
        return response.items.map(b => ({
          id: b.id,
          user_id: userId,
          badge_type: b.badge_type,
          year_earned: b.year_earned,
          hours_completed: b.hours_completed,
          awarded_at: b.awarded_at,
          name: `${b.badge_type} Badge`, // Default name
          icon: '🏆' // Default icon
        }));
      } catch (e) {
        console.error("Failed to get badges", e);
        return [];
      }
    }
  },

  analytics: {
    getUserLearningHours: async (userId: string) => {
      return fetchApi<any>(`/reports/user/${userId}/learning-hours`);
    },
    getUserTrainingHistory: async (userId: string) => {
      return fetchApi<any>(`/reports/user/${userId}/training-history`);
    },
    getAdminStats: async () => {
      return fetchApi<any>('/reports/admin/training-stats');
    },
    getDepartmentStats: async () => {
      return fetchApi<any>('/reports/admin/department-stats');
    },
    getTeamStats: async (managerId: string) => {
      return fetchApi<any>(`/reports/manager/${managerId}/team-progress`);
    },
    getTopLearners: async () => {
      return fetchApi<any[]>('/reports/admin/top-learners');
    }
  },

  content: {
    createModule: async (trainingId: string, title: string, order: number = 0) => {
      return fetchApi<any>(`/trainings/${trainingId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title, order })
      });
    },
    updateModule: async (moduleId: string, updates: { title?: string, order?: number }) => {
      return fetchApi<any>(`/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    deleteModule: async (moduleId: string) => {
      return fetchApi<any>(`/modules/${moduleId}`, { method: 'DELETE' });
    },
    createLesson: async (moduleId: string, lesson: any) => {
      return fetchApi<any>(`/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(lesson)
      });
    },
    updateLesson: async (lessonId: string, updates: any) => {
      return fetchApi<any>(`/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    deleteLesson: async (lessonId: string) => {
      return fetchApi<any>(`/lessons/${lessonId}`, { method: 'DELETE' });
    }
  },

  progress: {
    completeLesson: async (lessonId: string, quizScore: number = 0) => {
      return fetchApi<any>(`/lessons/${lessonId}/complete?quiz_score=${quizScore}`, {
        method: 'POST'
      });
    },
    getTrainingProgress: async (trainingId: string) => {
      return fetchApi<{ completed_lessons: string[] }>(`/trainings/${trainingId}/progress`);
    }
  }
};
