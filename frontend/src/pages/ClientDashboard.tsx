import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meApi } from '../api/client';
import StatCard from '../components/StatCard';
import Layout from '../components/Layout';
import type { ClientStats, CurrentUser, Goal } from '../types';

const GOAL_LABELS: Record<Goal, string> = {
  weight_gain: 'Набор массы',
  weight_loss: 'Похудение',
  recovery: 'Восстановление',
  maintenance: 'Поддержание',
};

interface Props {
  currentUser: CurrentUser;
}

export default function ClientDashboard({ currentUser }: Props) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meApi
      .getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goalLabel = stats?.goal ? (GOAL_LABELS[stats.goal] ?? '—') : '—';
  const lastWeight =
    stats?.last_measurement?.weight != null
      ? `${stats.last_measurement.weight} кг`
      : '—';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e8e3e 0%, #167a34 100%)',
            borderRadius: 16,
            padding: '20px 20px 16px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Привет, {currentUser.first_name}! 💪
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
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
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <StatCard
                label="Тренировок в месяце"
                value={stats?.sessions_this_month ?? '—'}
                icon="📅"
                color="#1e8e3e"
              />
              <StatCard
                label="За неделю"
                value={stats?.sessions_this_week ?? '—'}
                icon="🏋️"
                color="#2481cc"
              />
              <StatCard
                label="Цель"
                value={goalLabel}
                icon="🎯"
                color="#e37400"
              />
              <StatCard
                label="Последний вес"
                value={lastWeight}
                icon="⚖️"
                color="#9334e9"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#555' }}>
            Действия
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/workout')}
              style={{
                background: '#1e8e3e',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '18px 20px',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 60,
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(30,142,62,0.3)',
              }}
            >
              <span style={{ fontSize: 24 }}>🏋️</span>
              <span>Записать тренировку</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.7 }}>›</span>
            </button>

            <button
              onClick={() => navigate('/measurements')}
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
              }}
            >
              <span style={{ fontSize: 24 }}>📏</span>
              <span>Вес и замеры</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
