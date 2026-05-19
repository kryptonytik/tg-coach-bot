import { useNavigate } from 'react-router-dom';
import { trainerApi } from '../api/client';
import { useApi } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import Layout from '../components/Layout';

const today = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const { data: stats, loading } = useApi(() => trainerApi.getStats(), []);

  return (
    <Layout>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2481cc 0%, #1a6bb5 100%)',
          borderRadius: 16,
          padding: '20px 20px 16px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Тренер Влад 💪</div>
        <div style={{ fontSize: 14, opacity: 0.85, textTransform: 'capitalize' }}>{today}</div>
      </div>

      {/* Stats */}
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#555' }}>
          Статистика
        </h2>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  background: '#e8e8e8',
                  borderRadius: 12,
                  height: 80,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard
              label="Подопечных"
              value={stats?.total_clients ?? '—'}
              icon="👤"
              color="#2481cc"
            />
            <StatCard
              label="Активных"
              value={stats?.active_clients ?? '—'}
              icon="✅"
              color="#1e8e3e"
            />
            <StatCard
              label="Тренировок сегодня"
              value={stats?.sessions_today ?? '—'}
              icon="🏋️"
              color="#e37400"
            />
            <StatCard
              label="За неделю"
              value={stats?.sessions_this_week ?? '—'}
              icon="📅"
              color="#9334e9"
            />
          </div>
        )}
      </div>

      {/* Menu */}
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#555' }}>
          Действия
        </h2>

        {/* Section: Подопечные */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/workout')}
            style={{
              background: '#2481cc',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '16px 20px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              textAlign: 'left',
              width: '100%',
              boxShadow: '0 2px 8px rgba(36,129,204,0.3)',
            }}
          >
            <span style={{ fontSize: 24 }}>🏋️</span>
            <span>Записать тренировку</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
          </button>

          <button
            onClick={() => navigate('/clients')}
            style={{
              background: '#fff',
              color: '#2481cc',
              border: '2px solid #2481cc',
              borderRadius: 14,
              padding: '16px 20px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 24 }}>👥</span>
            <span>Подопечные</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
          </button>

          <button
            onClick={() => navigate('/clients/add')}
            style={{
              background: '#fff',
              color: '#1e8e3e',
              border: '2px solid #1e8e3e',
              borderRadius: 14,
              padding: '16px 20px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 24 }}>➕</span>
            <span>Добавить подопечного</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
          </button>
        </div>

        {/* Divider with label "МОИ ТРЕНИРОВКИ" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', letterSpacing: 1 }}>МОИ ТРЕНИРОВКИ</div>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
        </div>

        {/* Section: Я */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => navigate('/my-workout')}
              style={{
                background: '#9334e9',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '16px 20px',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: 22 }}>💪</span>
              <span style={{ flex: 1 }}>Тренировка</span>
              <span style={{ fontSize: 18, opacity: 0.5 }}>›</span>
            </button>

            <button
              onClick={() => navigate('/my-workout-history')}
              style={{
                background: '#7b1fa2',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '16px 20px',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: 22 }}>📋</span>
              <span style={{ flex: 1 }}>История</span>
              <span style={{ fontSize: 18, opacity: 0.5 }}>›</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/trainer-profile')}
            style={{
              background: '#fff',
              color: '#9334e9',
              border: '2px solid #9334e9',
              borderRadius: 14,
              padding: '16px 20px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              width: '100%',
            }}
          >
            <span style={{ fontSize: 24 }}>👤</span>
            <span>Мой профиль</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: '#e8e8e8', margin: '4px 0' }} />

          <button
            onClick={() => navigate('/settings/exercises')}
            style={{
              background: '#fff',
              color: '#555',
              border: '2px solid #d0d0d0',
              borderRadius: 14,
              padding: '16px 20px',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              width: '100%',
            }}
          >
            <span style={{ fontSize: 24 }}>⚙️</span>
            <span>Упражнения</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
}
