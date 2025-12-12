import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';

import { api } from '../services/api';

import { CurrentUser } from '../types';

interface ReportsProps {
  user?: CurrentUser;
  userRole?: UserRole;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [view, setView] = useState<'organizational' | 'team'>('organizational');
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [topLearners, setTopLearners] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Admin Stats
        const adminStats = await api.analytics.getAdminStats();
        const deptStats = await api.analytics.getDepartmentStats();
        const learners = await api.analytics.getTopLearners();
        setTopLearners(learners);

        // Process Department Data
        const processedDeptData = deptStats.departments.map((d: any) => ({
          name: d.department_name,
          completions: d.total_completions,
          hours: d.total_learning_hours
        }));
        setDepartmentData(processedDeptData);

        // Process Compliance Data (Enrollments by status)
        const statusCounts = adminStats.enrollments_by_status;
        const processedComplianceData = [
          { name: 'Completed', value: statusCounts['COMPLETED'] || 0 },
          { name: 'Overdue', value: 0 }, // Backend doesn't track overdue yet
          { name: 'In Progress', value: (statusCounts['IN_PROGRESS'] || 0) + (statusCounts['ENROLLED'] || 0) },
        ];
        setComplianceData(processedComplianceData);

        // Fetch Team Data
        if (user) {
          const teamStats = await api.analytics.getTeamStats(user.id).catch(() => null);
          if (teamStats) {
            // Transform team data to match UI expectations
            const members = teamStats.team_members.map((m: any) => ({
              id: m.user_id,
              name: m.full_name,
              role: 'Member', // Default
              progress: Math.round((m.completed / (m.total_enrollments || 1)) * 100),
              mandatory: m.in_progress > 0 ? 'In Progress' : 'Completed', // Simplified
              status: m.completed > 0 ? 'On Track' : 'At Risk' // Simplified logic
            }));
            setTeamData(members);
          }
        }

      } catch (e) {
        console.error("Failed to fetch reports data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  // Calculate Team Summary Stats
  const teamTotalMembers = teamData.length;
  const teamAvgProgress = teamData.length > 0
    ? Math.round(teamData.reduce((acc, curr) => acc + curr.progress, 0) / teamData.length)
    : 0;
  const teamMandatoryPending = teamData.filter(m => m.mandatory !== 'Completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500">Overview of learning progress and compliance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('organizational')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'organizational' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            >
              Organization
            </button>
            <button
              onClick={() => setView('team')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'team' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            >
              My Team
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {view === 'organizational' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Performance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Learning Hours by Department</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="hours" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Compliance Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Mandatory Training Compliance</h3>
              <div className="h-80 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pb-8">
                  <span className="text-3xl font-bold text-slate-800">
                    {complianceData.reduce((acc, curr) => acc + curr.value, 0) > 0
                      ? Math.round((complianceData[0].value / complianceData.reduce((acc, curr) => acc + curr.value, 0)) * 100)
                      : 0}%
                  </span>
                  <p className="text-xs text-slate-500">Compliance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Top Learners (Leaderboard)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Rank</th>
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Department</th>
                    <th className="px-6 py-3 font-semibold">Hours</th>
                    <th className="px-6 py-3 font-semibold">Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {topLearners.length > 0 ? topLearners.map((learner, index) => (
                    <tr key={learner.user_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {learner.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-700">{learner.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{learner.department}</td>
                      <td className="px-6 py-4 text-slate-600">{learner.hours}h</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">{learner.badges} Badges</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-slate-500">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Manager Team View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mr-4">
                <Users size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Total Team Members</p>
                <h3 className="text-2xl font-bold text-slate-800">{teamTotalMembers}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Team Avg Progress</p>
                <h3 className="text-2xl font-bold text-slate-800">{teamAvgProgress}%</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="p-3 rounded-full bg-amber-50 text-amber-600 mr-4">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Mandatory Pending</p>
                <h3 className="text-2xl font-bold text-slate-800">{teamMandatoryPending}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Team Learning Status</h3>
              <button className="text-sm text-indigo-600 font-medium hover:underline">View Detailed Report</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Overall Progress</th>
                    <th className="px-6 py-4">Mandatory Training</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamData.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{member.name}</td>
                      <td className="px-6 py-4 text-slate-600">{member.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${member.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500">{member.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.mandatory === 'Completed' && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">
                            <CheckCircle size={12} /> Completed
                          </span>
                        )}
                        {member.mandatory === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                            <AlertCircle size={12} /> Overdue
                          </span>
                        )}
                        {(member.mandatory === 'In Progress' || member.mandatory === 'Pending') && (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                            <ClockIcon size={12} /> {member.mandatory}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${member.status === 'On Track' ? 'bg-slate-100 text-slate-600' :
                          member.status === 'At Risk' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClockIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export default Reports;