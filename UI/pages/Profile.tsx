import React, { useState } from 'react';
import { CurrentUser, EnrollmentStatus } from '../types';
import { api } from '../services/api';
import { Award, Code, GraduationCap, MapPin, Briefcase, X, Save, Download } from 'lucide-react';



const Profile: React.FC<{ user: CurrentUser }> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.first_name,
    lastName: user.last_name,
    jobTitle: user.job_title || '',
    bio: user.bio || ''
  });

  const completedCount = user.training_history.filter(h => h.status === EnrollmentStatus.COMPLETED).length;

  const downloadCertificate = (cert: any) => {
    const certWindow = window.open('', '_blank');
    if (certWindow) {
      certWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${cert.name}</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; text-align: center; padding: 50px; border: 20px solid #f3f4f6; margin: 0; min-height: 90vh; display: flex; flex-direction: column; justify-content: center; }
              .content { border: 2px solid #e5e7eb; padding: 40px; border-radius: 8px; }
              .header { font-size: 40px; font-weight: bold; color: #1f2937; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
              .sub-header { font-size: 18px; color: #6b7280; margin-bottom: 40px; }
              .name { font-size: 48px; font-weight: bold; color: #4f46e5; margin: 20px 0; font-family: 'Georgia', serif; }
              .text { font-size: 20px; color: #374151; margin-bottom: 10px; }
              .course { font-size: 32px; font-weight: bold; color: #111827; margin: 20px 0; }
              .date { font-size: 16px; color: #6b7280; margin-top: 40px; }
              .footer { margin-top: 60px; border-top: 1px solid #e5e7eb; pt: 20px; font-size: 12px; color: #9ca3af; }
              @media print {
                 body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                 .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="content">
              <div class="header">Certificate of Completion</div>
              <div class="sub-header">This certifies that</div>
              <div class="name">${user.first_name} ${user.last_name}</div>
              <div class="text">has successfully completed the training program</div>
              <div class="course">${cert.name}</div>
              <div class="text">Issued by ${cert.issuing_body}</div>
              <div class="date">Awarded on ${new Date(cert.issue_date).toLocaleDateString()}</div>
              
              <div class="footer">
                Certificate ID: ${cert.id} • Verified by L&D Portal
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      certWindow.document.close();
    }
  };

  const handleSave = async () => {
    try {
      await api.users.updateProfile(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        job_title: formData.jobTitle,
        bio: formData.bio
      } as any);
      setIsEditing(false);
      alert("Profile updated successfully!");
      // Ideally refresh user data here or update local state
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <img
                src={user.avatar}
                alt={user.first_name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"
              />
              <div className="ml-6 mb-2 hidden md:block">
                <h1 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
                <p className="text-slate-500">{user.job_title}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Edit Profile
            </button>
          </div>

          <div className="md:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
            <p className="text-slate-500">{user.job_title}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase size={18} className="text-slate-400" /> Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Department</span>
                  <span className="text-slate-900 font-medium">{user.department_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Role</span>
                  <span className="text-slate-900 font-medium">{user.role}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-900 font-medium flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" /> New York, US
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-900 font-medium truncate max-w-[150px]">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Code size={18} className="text-slate-400" /> Tech Stack & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                    {skill.name} <span className="opacity-70 text-[10px] ml-1">({skill.proficiency})</span>
                  </span>
                ))}
                <button className="px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-xs font-medium hover:border-slate-400 hover:text-slate-600">
                  + Add Skill
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Award size={18} className="text-slate-400" /> Badges
              </h3>
              <div className="flex gap-4">
                {user.badges.map(badge => (
                  <div key={badge.id} className="flex flex-col items-center group cursor-pointer">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-2xl border border-amber-100 group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-600 mt-2">{badge.name}</span>
                    <span className="text-[10px] text-slate-400">{badge.badge_type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Certifications</h2>
            <button className="text-sm text-indigo-600 hover:underline">Add New</button>
          </div>
          <div className="space-y-4">
            {user.certifications.map(cert => (
              <div key={cert.id} className="flex items-start justify-between p-4 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                    <GraduationCap className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{cert.name}</h4>
                    <p className="text-sm text-slate-500">{cert.issuing_body}</p>
                    {cert.expiry_date && (
                      <p className="text-xs text-slate-400 mt-1">Expires: {new Date(cert.expiry_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => downloadCertificate(cert)}
                  className="text-slate-400 hover:text-indigo-600 p-2"
                  title="Download Certificate"
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Learning Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">{user.learning_hours.total}</div>
              <div className="text-sm text-indigo-800 font-medium">Total Hours</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">{completedCount}</div>
              <div className="text-sm text-emerald-800 font-medium">Trainings Completed</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">92%</div>
              <div className="text-sm text-amber-800 font-medium">Avg. Score</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{user.badges.length}</div>
              <div className="text-sm text-purple-800 font-medium">Badges Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Training History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Training History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Training Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {user.training_history.length > 0 ? (
                user.training_history.map((entry) => (
                  <tr key={entry.training_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{entry.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.status === EnrollmentStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' :
                        entry.status === EnrollmentStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          entry.status === EnrollmentStatus.ENROLLED ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {entry.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-1/4">
                      {entry.status === EnrollmentStatus.COMPLETED ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-medium">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          <span>100%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${entry.status === EnrollmentStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'}`}
                              style={{ width: `${entry.progress || 0}%` }}
                            ></div>
                          </div>
                          <span>{entry.progress || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {entry.completion_date ? new Date(entry.completion_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No training history available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in scale-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;