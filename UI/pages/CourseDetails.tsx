import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CurrentUser, EnrollmentStatus } from '../types';
import {
  Clock,
  Calendar,
  Users,
  PlayCircle,
  CheckCircle,
  FileText,
  AlertCircle,
  ChevronLeft,
  Share2,
  Bookmark
} from 'lucide-react';

interface CourseDetailsProps {
  user: CurrentUser;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTraining = async () => {
      if (!id) return;
      try {
        const data = await api.trainings.get(id);
        setTraining(data || null);
      } catch (e) {
        console.error("Failed to fetch training", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Course Not Found</h2>
        <p className="text-slate-500 mt-2">The course you are looking for does not exist.</p>
        <Link to="/catalog" className="mt-4 text-indigo-600 hover:underline">Return to Catalog</Link>
      </div>
    );
  }

  const isEnrolled = user.training_history.some(h =>
    h.training_id === id && (h.status === EnrollmentStatus.ENROLLED || h.status === EnrollmentStatus.IN_PROGRESS)
  );

  const isCompleted = user.training_history.some(h =>
    h.training_id === id && h.status === EnrollmentStatus.COMPLETED
  );

  const handleEnroll = async () => {
    if (!training) return;
    try {
      await api.enrollments.enroll(user.id, training.id);
      navigate(`/learn/${training.id}`);
    } catch (e) {
      console.error("Enrollment failed", e);
      alert("Failed to enroll. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link to="/catalog" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft size={16} className="mr-1" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image for Mobile */}
          <div className="lg:hidden rounded-xl overflow-hidden shadow-sm">
            <img src={training.image} alt={training.title} className="w-full h-48 object-cover" />
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                {training.category}
              </span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                {training.type}
              </span>
              {training.is_mandatory && (
                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold flex items-center gap-1">
                  <AlertCircle size={10} /> Mandatory
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{training.title}</h1>
            <p className="text-slate-600 text-lg leading-relaxed">{training.description}</p>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
              {training.instructor.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Instructor</p>
              <p className="text-slate-900 font-medium">{training.instructor}</p>
            </div>
          </div>

          {/* Learning Outcomes */}
          {training.learning_outcomes && (
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">What you'll learn</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {training.learning_outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Syllabus */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Course Syllabus</h3>
            {training.modules && training.modules.length > 0 ? (
              <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
                {training.modules.map((module) => (
                  <div key={module.id} className="group">
                    <div className="p-4 bg-slate-50 font-medium text-slate-800 flex justify-between items-center">
                      <span>{module.title}</span>
                      <span className="text-xs text-slate-500">{module.lessons.length} lessons</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {module.lessons.map(lesson => (
                        <div key={lesson.id} className="p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                          {lesson.type === 'VIDEO' ? <PlayCircle size={18} className="text-slate-400" /> : <FileText size={18} className="text-slate-400" />}
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">{lesson.title}</p>
                          </div>
                          <span className="text-xs text-slate-400">{lesson.duration_minutes} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                Detailed syllabus coming soon.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 sticky top-6">
            <div className="rounded-lg overflow-hidden mb-6 hidden lg:block">
              <img src={training.image} alt={training.title} className="w-full h-48 object-cover" />
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 pb-3 border-b border-slate-50">
                <span className="flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Duration</span>
                <span className="font-medium text-slate-900">{training.duration_hours} Hours</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 pb-3 border-b border-slate-50">
                <span className="flex items-center gap-2"><Users size={16} className="text-indigo-500" /> Enrolled</span>
                <span className="font-medium text-slate-900">{training.enrolled_count} Learners</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 pb-3 border-b border-slate-50">
                <span className="flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> Start Date</span>
                <span className="font-medium text-slate-900">{new Date(training.start_date).toLocaleDateString()}</span>
              </div>
            </div>

            {isEnrolled ? (
              <Link
                to={`/learn/${training.id}`}
                className="block w-full py-3 bg-emerald-600 text-white text-center rounded-lg font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 mb-3"
              >
                Continue Learning
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 mb-3"
              >
                Enroll Now
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Bookmark size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
