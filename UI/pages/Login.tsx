import React, { useState } from 'react';
import { UserRole, CurrentUser } from '../types';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, User, Shield, Briefcase, Award } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: CurrentUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [email, setEmail] = useState('demo@company.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In real app, we use the email/password from state
      // The role selection in UI might be just for demo or we can auto-detect role from backend response
      const user = await api.auth.login(email, password);
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ role, icon: Icon, label, description }: { role: UserRole; icon: any; label: string; description: string }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(role)}
      className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 ${selectedRole === role
          ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500'
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === role ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`font-semibold text-sm ${selectedRole === role ? 'text-indigo-900' : 'text-slate-900'}`}>{label}</h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <GraduationCap className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Empower Your Growth Journey</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Access world-class training, track your skills, and advance your career with L&D Horizon's AI-powered learning portal.
          </p>
          <div className="mt-12 flex gap-4 text-sm font-medium text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> 500+ Courses
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> AI Assistant
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Skill Tracking
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-2">Choose your role to sign in to the portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                role={UserRole.EMPLOYEE}
                icon={User}
                label="Employee"
                description="Access courses & profile"
              />
              <RoleCard
                role={UserRole.MANAGER}
                icon={Briefcase}
                label="Manager"
                description="View team progress"
              />
              <RoleCard
                role={UserRole.ADMIN}
                icon={Shield}
                label="Admin"
                description="Manage content"
              />
              <RoleCard
                role={UserRole.SUPER_ADMIN}
                icon={Award}
                label="Super Admin"
                description="Full system control"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            &copy; 2025 L&D Horizon. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;