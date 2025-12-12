import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User as UserIcon,
  BarChart2,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Award,
  Users,
  Bell,
  PlayCircle
} from 'lucide-react';
import { UserRole, CurrentUser } from '../types';
import AIChatWidget from './AIChatWidget';

interface LayoutProps {
  children: React.ReactNode;
  user: CurrentUser | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  if (!user) return <>{children}</>;

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setIsSidebarOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(to)
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  const notifications = [
    { id: 1, text: "New mandatory training assigned: Workplace Safety", time: "2 hours ago", unread: true },
    { id: 2, text: "You earned the 'Quick Learner' badge!", time: "1 day ago", unread: false },
    { id: 3, text: "Reminder: Complete 'Cybersecurity Awareness' by Friday", time: "2 days ago", unread: false }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <GraduationCap className="w-8 h-8 text-indigo-500 mr-2" />
          <span className="text-xl font-bold text-slate-900">L&D Horizon</span>
        </div>

        <div className="p-4 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/catalog" icon={BookOpen} label="Training Catalog" />
          <NavItem to="/shorts" icon={PlayCircle} label="Learning Shorts" />
          <NavItem to="/my-learning" icon={Award} label="My Learning" />
          <NavItem to="/profile" icon={UserIcon} label="My Profile" />

          {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.MANAGER) && (
            <>
              <div className="mt-8 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Management
              </div>
              <NavItem to="/reports" icon={BarChart2} label="Reports & Analytics" />

              {user.role === UserRole.MANAGER && (
                <NavItem to="/reports" icon={Users} label="My Team" />
              )}

              {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                <NavItem to="/admin-trainings" icon={GraduationCap} label="Manage Trainings" />
              )}
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={user.avatar} alt={user.first_name} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-900 lg:hidden">Horizon</span>
          </div>

          <div className="flex-1"></div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                      <button className="text-xs text-indigo-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${n.unread ? 'bg-indigo-50/50' : ''}`}>
                          <p className={`text-sm ${n.unread ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{n.text}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-50 text-center">
                      <button className="text-xs text-slate-500 hover:text-indigo-600">View all notifications</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* AI Widget */}
      <AIChatWidget user={user} />
    </div>
  );
};

export default Layout;