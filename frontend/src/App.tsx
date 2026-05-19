import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { meApi } from './api/client';
import TrainerDashboard from './pages/TrainerDashboard';
import ClientList from './pages/ClientList';
import AddClient from './pages/AddClient';
import ClientProfile from './pages/ClientProfile';
import WorkoutFlow from './pages/WorkoutFlow';
import ClientDashboard from './pages/ClientDashboard';
import ClientRegistration from './pages/ClientRegistration';
import MeasurementsPage from './pages/MeasurementsPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import TrainerWorkoutPage from './pages/TrainerWorkoutPage';
import EditProfilePage from './pages/EditProfilePage';
import type { CurrentUser } from './types';
import './index.css';

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 16,
        background: '#f5f5f5',
      }}
    >
      <div style={{ fontSize: 48 }}>💪</div>
      <div style={{ fontSize: 16, color: '#888', fontWeight: 500 }}>Загрузка...</div>
    </div>
  );
}

function SmartRedirect({ currentUser, onRegistered }: { currentUser: CurrentUser; onRegistered: () => void }) {
  if (currentUser.role === 'trainer') {
    return <TrainerDashboard />;
  }
  if (currentUser.role === 'client') {
    if (!currentUser.client?.questionnaire) {
      return <ClientRegistration currentUser={currentUser} onRegistered={onRegistered} />;
    }
    return <ClientDashboard currentUser={currentUser} />;
  }
  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = () => {
    setLoading(true);
    meApi
      .getMe()
      .then(user => {
        setCurrentUser(user);
        setError(null);
      })
      .catch(err => {
        setError(err?.response?.data?.error || err?.message || 'Ошибка загрузки');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMe();
  }, []);

  if (loading) return <LoadingScreen />;

  if (error || !currentUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 16, color: '#c62828' }}>{error || 'Не удалось загрузить данные'}</div>
        <button
          onClick={fetchMe}
          style={{
            padding: '12px 32px',
            background: '#2481cc',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SmartRedirect currentUser={currentUser} onRegistered={fetchMe} />} />
        <Route path="/trainer" element={<TrainerDashboard />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/add" element={<AddClient />} />
        <Route path="/clients/:id" element={<ClientProfile />} />
        <Route path="/workout" element={<WorkoutFlow currentUser={currentUser} />} />
        <Route path="/client-dashboard" element={<ClientDashboard currentUser={currentUser} />} />
        <Route
          path="/register"
          element={<ClientRegistration currentUser={currentUser} onRegistered={fetchMe} />}
        />
        <Route path="/measurements" element={<MeasurementsPage currentUser={currentUser} />} />
        <Route path="/workout-history" element={<WorkoutHistoryPage />} />
        <Route path="/workout-detail/:id" element={<WorkoutDetailPage />} />
        <Route path="/my-workout" element={<TrainerWorkoutPage currentUser={currentUser} />} />
        <Route path="/edit-profile" element={<EditProfilePage currentUser={currentUser} onSaved={fetchMe} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
