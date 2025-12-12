import React, { useState } from 'react';
import { api } from '../services/api';
import { CurrentUser, EnrollmentStatus } from '../types';
import { Search, Calendar, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CatalogProps {
  user: CurrentUser;
}

const Catalog: React.FC<CatalogProps> = ({ user }) => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showEnrolledModal, setShowEnrolledModal] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const data = await api.trainings.list();
        setTrainings(data);
      } catch (e) {
        console.error("Failed to fetch trainings", e);
      }
    };
    fetchTrainings();
  }, []);

  // Extract unique categories from mocks
  const uniqueCategories = Array.from(new Set(trainings.map(t => t.category)));
  const categories = ['All', ...uniqueCategories];

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || training.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation to details if clicking enroll directly
    e.stopPropagation();
    try {
      await api.enrollments.enroll(user.id, id);
      setShowEnrolledModal(id);
      setTimeout(() => setShowEnrolledModal(null), 2000);
      // Optionally refresh trainings or user state here
    } catch (err) {
      console.error("Enrollment failed", err);
    }
  };

  const isEnrolled = (id: string) => user.training_history.some(h =>
    h.training_id === id && (h.status === EnrollmentStatus.ENROLLED || h.status === EnrollmentStatus.IN_PROGRESS || h.status === EnrollmentStatus.COMPLETED)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Training Catalog</h1>
          <p className="text-slate-500">Explore and enroll in courses to enhance your skills.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search for courses..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map(training => (
          <Link
            to={`/course/${training.id}`}
            key={training.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={training.image}
                alt={training.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700 shadow-sm">
                  {training.category}
                </span>
                {training.is_mandatory && (
                  <span className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                    <AlertCircle size={10} /> Mandatory
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2" title={training.title}>{training.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-1">{training.description}</p>

              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{new Date(training.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500" />
                  <span>{training.duration_hours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-indigo-500" />
                  <span>{training.enrolled_count}/{training.max_participants} Enrolled</span>
                </div>
              </div>

              <button
                disabled={isEnrolled(training.id) || training.enrolled_count >= training.max_participants}
                onClick={(e) => handleEnroll(e, training.id)}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${isEnrolled(training.id)
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                  : training.enrolled_count >= training.max_participants
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                  }`}
              >
                {isEnrolled(training.id) ? 'Enrolled' : training.enrolled_count >= training.max_participants ? 'Full' : 'Enroll Now'}
              </button>
            </div>
          </Link>
        ))}
      </div>

      {filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
          <p className="text-slate-500">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Toast Notification */}
      {showEnrolledModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <CheckCircle size={20} />
          <span className="font-medium">Successfully enrolled in course!</span>
        </div>
      )}
    </div>
  );
};

export default Catalog;
