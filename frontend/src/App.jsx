import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Structures from './pages/Structures';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import StructureDetail from './pages/StructureDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Notifications from './pages/Notifications';
import MemberDashboard from './pages/MemberDashboard';
import PresidentDashboard from './pages/PresidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/structures" element={<Structures />} />
          <Route path="/fil" element={<Feed />} />
          <Route path="/structures/:id" element={<StructureDetail />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/evenements/:id" element={<EventDetail />} />

          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/tableau-de-bord" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/president/:structureId" element={<ProtectedRoute><PresidentDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
