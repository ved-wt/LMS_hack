import React, { useState } from 'react';
import { CurrentUser, EnrollmentStatus } from '../types';
import { api } from '../services/api';
import { Clock, CheckCircle, PlayCircle, Award, Calendar, AlertCircle, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyLearning: React.FC<{ user: CurrentUser }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'completed'>('current');
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string, date: string } | null>(null);
  const [trainings, setTrainings] = useState<any[]>([]);

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

  const enrolledIds = user.training_history
    .filter(h => h.status === EnrollmentStatus.ENROLLED || h.status === EnrollmentStatus.IN_PROGRESS)
    .map(h => h.training_id);

  const completedIds = user.training_history
    .filter(h => h.status === EnrollmentStatus.COMPLETED)
    .map(h => h.training_id);

  const enrolledTrainings = trainings.filter(t => enrolledIds.includes(t.id));
  const completedTrainings = trainings.filter(t => completedIds.includes(t.id));

  const displayList = activeTab === 'current' ? enrolledTrainings : completedTrainings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Learning</h1>
        <p className="text-slate-500">Track your progress and access your course materials.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'current'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            In Progress
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
              {enrolledTrainings.length}
            </span>
            {activeTab === 'current' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 text-sm font-medium transition-all relative ${activeTab === 'completed'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Completed
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
              {completedTrainings.length}
            </span>
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayList.length > 0 ? (
          displayList.map(training => (
            <div key={training.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <img
                    src={training.image}
                    alt={training.title}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{training.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{training.type} • {training.instructor}</p>
                    {training.is_mandatory && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                        <AlertCircle size={10} /> MANDATORY
                      </span>
                    )}
                  </div>
                </div>
                {activeTab === 'completed' && (
                  <div className="text-emerald-500">
                    <CheckCircle size={24} />
                  </div>
                )}
              </div>

              {/* Progress Bar for Current */}
              {activeTab === 'current' && (() => {
                const history = user.training_history.find(h => h.training_id === training.id);
                const progress = history?.progress || 0;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} />
                  <span>{training.duration_hours} hours total</span>
                </div>

                {activeTab === 'current' ? (
                  <Link
                    to={`/learn/${training.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <PlayCircle size={16} /> Continue
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedCertificate({ title: training.title, date: new Date().toLocaleDateString() })}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Award size={16} /> Certificate
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Calendar className="text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-medium">No courses found</h3>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'current'
                ? "You haven't enrolled in any courses yet."
                : "You haven't completed any courses yet."}
            </p>
            {activeTab === 'current' && (
              <Link to="/catalog" className="mt-4 inline-block px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                Browse Catalog
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden relative">
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-12 text-center border-8 border-double border-slate-100 m-4 rounded-lg">
              <Award size={64} className="mx-auto text-amber-500 mb-6" />
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Certificate of Completion</h2>
              <p className="text-slate-500 mb-8">This certifies that</p>

              <div className="text-2xl font-bold text-indigo-900 border-b border-slate-200 pb-2 mb-8 inline-block px-8">
                {user.first_name} {user.last_name}
              </div>

              <p className="text-slate-500 mb-2">Has successfully completed the course</p>
              <h3 className="text-xl font-bold text-slate-800 mb-8">{selectedCertificate.title}</h3>

              <div className="flex justify-center gap-12 text-sm text-slate-500">
                <div className="text-center">
                  <div className="border-t border-slate-300 pt-2 w-32 mx-auto">Date</div>
                  <div className="font-semibold">{selectedCertificate.date}</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-300 pt-2 w-32 mx-auto">Signature</div>
                  <div className="font-serif italic text-lg text-indigo-800 -mt-8 font-bold">L&D Director</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => alert('Downloading PDF...')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLearning;