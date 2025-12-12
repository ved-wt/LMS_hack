import React from 'react';
import { CurrentUser, UserRole, EnrollmentStatus, TrainingStatus } from '../types';
import { api } from '../services/api';
import { Clock, CheckCircle, Award, Target, ArrowRight, Users, AlertCircle, Flame, TrendingUp, Trophy, Medal, Star, Zap, BookOpen } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-lg ${color} bg-opacity-10 mr-4`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

interface DashboardProps {
  user: CurrentUser;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [upcomingTrainings, setUpcomingTrainings] = React.useState<any[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const allTrainings = await api.trainings.list();
        const enrolledIds = user.training_history
          .filter(h => h.status === EnrollmentStatus.ENROLLED || h.status === EnrollmentStatus.IN_PROGRESS)
          .map(h => h.training_id);

        const upcoming = allTrainings
          .filter(t => enrolledIds.includes(t.id))
          .slice(0, 3);

        setUpcomingTrainings(upcoming);

        if (user.role === UserRole.SUPER_ADMIN) {
          const pending = allTrainings.filter(t => t.status === TrainingStatus.PENDING_APPROVAL).length;
          setPendingCount(pending);
        }
      } catch (e) {
        console.error("Failed to fetch upcoming trainings", e);
      }
    };
    fetchUpcoming();
  }, [user]);

  // Mock leaderboard data
  const leaderboardData = [
    { name: user.first_name + ' ' + user.last_name, hours: user.learning_hours.total, rank: 1, avatar: '👤', isCurrentUser: true, points: Math.round(user.learning_hours.total * 10) + user.badges.length * 50 },
    { name: 'Sarah Chen', hours: 156, rank: 2, avatar: '👩', isCurrentUser: false, points: 1810 },
    { name: 'Michael Ross', hours: 142, rank: 3, avatar: '👨', isCurrentUser: false, points: 1670 },
    { name: 'Emily Parker', hours: 128, rank: 4, avatar: '👩‍💼', isCurrentUser: false, points: 1530 },
    { name: 'James Wilson', hours: 115, rank: 5, avatar: '👨‍💻', isCurrentUser: false, points: 1400 },
  ].sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Mock skill distribution
  const skillDistribution = [
    { name: 'Technical', value: 45, color: '#4f46e5' },
    { name: 'Leadership', value: 25, color: '#10b981' },
    { name: 'Business', value: 20, color: '#f59e0b' },
    { name: 'Soft Skills', value: 10, color: '#8b5cf6' },
  ];

  // Mock recent achievements
  const recentAchievements = [
    { title: 'Quick Learner', description: 'Completed 3 courses this month', icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { title: 'Perfect Attendance', description: '100% session attendance rate', icon: Star, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { title: 'Team Player', description: 'Helped 5 colleagues this week', icon: Users, color: 'text-green-500', bgColor: 'bg-green-50' },
  ];

  // Mock completion rate trend
  const completionTrend = [
    { month: 'Jul', rate: 75 },
    { month: 'Aug', rate: 82 },
    { month: 'Sep', rate: 88 },
    { month: 'Oct', rate: 85 },
    { month: 'Nov', rate: 92 },
    { month: 'Dec', rate: 95 },
  ];

  // Prepare chart data from record map
  let learningData = Object.entries(user.learning_hours.monthly_breakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => ({
      name: date, // "YYYY-MM"
      hours: hours
    }));

  // Mock data if real data is insufficient (for demo purposes)
  if (learningData.length === 0) {
    learningData = [
      { name: 'Jan', hours: 12 },
      { name: 'Feb', hours: 18 },
      { name: 'Mar', hours: 15 },
      { name: 'Apr', hours: 25 },
      { name: 'May', hours: 20 },
      { name: 'Jun', hours: 32 },
    ];
  }

  const enrolledIds = user.training_history
    .filter(h => h.status === EnrollmentStatus.ENROLLED || h.status === EnrollmentStatus.IN_PROGRESS)
    .map(h => h.training_id);

  const completedCount = user.training_history
    .filter(h => h.status === EnrollmentStatus.COMPLETED).length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.first_name} 👋</h1>
          <p className="text-slate-500">
            {user.role === UserRole.MANAGER
              ? "Here's how your team is performing today."
              : user.role === UserRole.SUPER_ADMIN
                ? "System overview and pending actions."
                : "You're making great progress in your learning journey."}
          </p>
        </div>
        <Link to="/catalog" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          Browse Catalog
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          icon={Clock}
          label={user.role === UserRole.MANAGER ? "Team Avg Hours" : "Learning Hours"}
          value={user.role === UserRole.MANAGER ? "42.5" : user.learning_hours.total}
          color="bg-indigo-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Courses Completed"
          value={completedCount}
          color="bg-emerald-500"
        />
        <StatCard
          icon={user.role === UserRole.MANAGER ? Users : Target}
          label={user.role === UserRole.MANAGER ? "Team Members" : "In Progress"}
          value={user.role === UserRole.MANAGER ? "12" : enrolledIds.length}
          color="bg-amber-500"
        />
        <StatCard
          icon={Award}
          label="Badges Earned"
          value={user.badges.length}
          color="bg-purple-500"
        />
        <StatCard
          icon={Flame}
          label="Daily Streak"
          value={`${user.streak_count || 0} Days`}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Achievements Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <h2 className="text-xl font-bold">Recent Achievements</h2>
          </div>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">+{user.badges.length * 50} XP</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentAchievements.map((achievement, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <achievement.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-xs text-white/80">{achievement.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Specific Widgets */}
      {user.role === UserRole.SUPER_ADMIN && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Pending Approvals</h3>
              <p className="text-sm text-amber-700">{pendingCount} trainings require your approval.</p>
            </div>
          </div>
          <Link to="/admin-trainings" className="px-4 py-2 bg-white text-amber-700 font-medium rounded-lg text-sm border border-amber-200 hover:bg-amber-100 transition-colors">
            Review Now
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Activity Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Learning Activity</h2>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-semibold">+23% vs last month</span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={learningData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rate & Skill Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion Rate Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Completion Rate</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">Current: <span className="font-bold text-green-600">95%</span></p>
            </div>

            {/* Skill Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Skill Distribution</h3>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {skillDistribution.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: skill.color }}></div>
                    <span className="text-xs text-slate-600">{skill.name} ({skill.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-800">Leaderboard</h2>
              </div>
              <span className="text-xs text-slate-500">This Month</span>
            </div>

            <div className="space-y-3">
              {leaderboardData.map((person, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${person.isCurrentUser
                    ? 'bg-indigo-50 border-2 border-indigo-200 shadow-sm'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200 font-bold text-sm">
                    {person.rank === 1 && <Medal className="w-5 h-5 text-yellow-500" />}
                    {person.rank === 2 && <Medal className="w-5 h-5 text-slate-400" />}
                    {person.rank === 3 && <Medal className="w-5 h-5 text-amber-700" />}
                    {person.rank > 3 && <span className="text-slate-600">#{person.rank}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{person.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${person.isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {person.name} {person.isCurrentUser && <span className="text-xs text-indigo-600">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{person.points} points</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{person.hours}h</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link to="/catalog" className="flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View Full Leaderboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Upcoming Trainings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800">Upcoming Classes</h2>
              </div>
              <Link to="/my-learning" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</Link>
            </div>

            <div className="space-y-3">
              {upcomingTrainings.length > 0 ? (
                upcomingTrainings.map(training => (
                  <div key={training.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                        {new Date(training.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {training.is_mandatory && (
                        <span className="text-xs font-semibold text-red-500">Mandatory</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                      {training.title}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <span>{training.type}</span>
                      <span>•</span>
                      <span>{training.duration_hours}h</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm mb-3">No upcoming trainings scheduled.</p>
                  <Link to="/catalog" className="text-sm font-medium text-indigo-600 hover:underline">
                    Find a course
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recommended</h3>
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-4 text-white">
                <h4 className="font-bold text-sm mb-1">Advanced React Patterns</h4>
                <p className="text-xs text-slate-300 mb-3">Based on your role & skills</p>
                <Link to="/catalog" className="inline-flex items-center text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-white border border-white/10">
                  View Details <ArrowRight size={12} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;