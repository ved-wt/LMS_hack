import React, { useState, useEffect } from 'react';
import { CurrentUser, UserRole, TrainingStatus, Training } from '../types';
import { Plus, Edit, Trash2, Check, X, AlertCircle, Search, Eye, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface AdminTrainingsProps {
  user: CurrentUser;
}

const AdminTrainings: React.FC<AdminTrainingsProps> = ({ user }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const data = await api.trainings.list();
      setTrainings(data);
    } catch (err) {
      showNotification('Failed to load trainings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  // Filter logic
  const filteredTrainings = trainings.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'pending' && t.status === TrainingStatus.PENDING_APPROVAL);
    return matchesSearch && matchesTab;
  });

  const pendingCount = trainings.filter(t => t.status === TrainingStatus.PENDING_APPROVAL).length;

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprove = async (id: string) => {
    try {
      await api.trainings.approve(id);
      await loadTrainings();
      showNotification('Training successfully approved and published.', 'success');
    } catch (e) {
      showNotification('Failed to approve training', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.trainings.reject(id, "Rejected by admin");
      await loadTrainings();
      showNotification('Training rejected and moved to Drafts.', 'error');
    } catch (e) {
      showNotification('Failed to reject training', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this training?')) {
      try {
        await api.trainings.delete(id);
        await loadTrainings();
        showNotification('Training deleted.', 'success');
      } catch (e) {
        showNotification('Failed to delete training', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Trainings</h1>
          <p className="text-slate-500">Create, edit, and oversee training programs.</p>
        </div>
        {user.role !== UserRole.MANAGER && (
          <Link 
            to="/admin/course/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus size={18} />
            Create Training
          </Link>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
           <button 
             onClick={() => setActiveTab('all')}
             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
           >
             All Trainings
           </button>
           {user.role === UserRole.SUPER_ADMIN && (
             <button 
               onClick={() => setActiveTab('pending')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Approvals
               {pendingCount > 0 && (
                 <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>
               )}
             </button>
           )}
        </div>

        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search trainings..." 
             className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Training Title</th>
                  <th className="px-6 py-4 font-semibold">Instructor</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainings.map((training) => (
                  <tr key={training.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{training.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{training.category} • {training.duration_hours}h</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{training.instructor}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {training.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {training.status === TrainingStatus.PENDING_APPROVAL ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                          <AlertCircle size={12} /> Pending Approval
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          training.status === TrainingStatus.DRAFT ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {training.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Super Admin Actions for Pending Items */}
                        {user.role === UserRole.SUPER_ADMIN && training.status === TrainingStatus.PENDING_APPROVAL ? (
                          <>
                            <button 
                              onClick={() => navigate(`/admin/course/edit/${training.id}`)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Review & Edit"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleApprove(training.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(training.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          // Standard Actions for other states/roles
                          <>
                            <button 
                              onClick={() => navigate(`/admin/course/edit/${training.id}`)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(training.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTrainings.length === 0 && (
               <div className="p-12 text-center text-slate-500">
                 No trainings found matching your criteria.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTrainings;