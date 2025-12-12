import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import MyLearning from './pages/MyLearning';
import AdminTrainings from './pages/AdminTrainings';
import AdminCourseEditor from './pages/AdminCourseEditor';
import CourseDetails from './pages/CourseDetails';
import LearningScreen from './pages/LearningScreen';
import ShortsLearning from './pages/ShortsLearning';
import { UserRole, CurrentUser } from './types';

import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await api.auth.getMe();
        setUser(currentUser);
      } catch (e) {
        // Token invalid or expired
        api.auth.logout();
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (loggedInUser: CurrentUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/catalog" element={<Catalog user={user} />} />
          <Route path="/course/:id" element={<CourseDetails user={user} />} />
          <Route path="/learn/:id" element={<LearningScreen user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/my-learning" element={<MyLearning user={user} />} />
          <Route path="/shorts" element={<ShortsLearning user={user} />} />
          <Route
            path="/reports"
            element={
              user.role !== UserRole.EMPLOYEE ? <Reports user={user} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/admin-trainings"
            element={
              (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
                ? <AdminTrainings user={user} />
                : <Navigate to="/" />
            }
          />
          {/* Admin Editor Routes */}
          <Route
            path="/admin/course/new"
            element={
              (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
                ? <AdminCourseEditor user={user} />
                : <Navigate to="/" />
            }
          />
          <Route
            path="/admin/course/edit/:id"
            element={
              (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
                ? <AdminCourseEditor user={user} />
                : <Navigate to="/" />
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;