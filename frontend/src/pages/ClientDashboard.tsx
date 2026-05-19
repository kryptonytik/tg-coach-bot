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

function WeightMiniChart({ measurements }: { measurements: any[] }) {
  const pts = [...measurements]
    .filter(m => m.weight != null)
    .reverse()
    .slice(0, 6);
  if (pts.length < 2) return (
    <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '12px 0' }}>
      Нужно минимум 2 замера для графика
    </div>
  );

  const weights = pts.map((m: any) => m.weight as number);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const W = 300, H = 60, pad = 20;

  const coords = weights.map((w, i) => ({
    x: pad + (i / (weights.length - 1)) * (W - 2 * pad),
    y: H - pad - ((w - minW) / range) * (H - 2 * pad),
  }));
  const polyline = coords.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>Динамика веса</div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', height: 80, overflow: 'visible' }}>
        <polyline points={polyline} fill="none" stroke="#9334e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#9334e9" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#555">{weights[i]}</text>
            <text x={p.x} y={H + 18} textAnchor="middle" fontSize="9" fill="#aaa">
              {new Date(pts[i].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function WorkoutsBarChart({ sessions }: { sessions: any[] }) {
  const now = new Date();
  const weeks = [3, 2, 1, 0].map(weeksAgo => {
    const end = new Date(now.getTime() - weeksAgo * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    const count = sessions.filter((s: any) => {
      const d = new Date(s.date);
      return d >= start && d < end;
    }).length;
    const monthShort = start.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
    const label = `${start.getDate()}-${end.getDate()} ${monthShort}`;
    return { label, count };
  });

  const max = Math.max(...weeks.map(w => w.count), 1);
  const W = 280, H = 56, bw = 50, gap = 16, padL = 10;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>Тренировки по неделям</div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ width: '100%', height: 80, overflow: 'visible' }}>
        {weeks.map((week, i) => {
          const barH = Math.max((week.count / max) * H, week.count > 0 ? 4 : 0);
          const x = padL + i * (bw + gap);
          const y = H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={barH || 2} rx="4"
                fill={i === 3 ? '#2481cc' : '#93c5fd'} />
              <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#888">{week.label}</text>
              {week.count > 0 && (
                <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#555">{week.count}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ClientDashboard({ currentUser }: Props) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<'weight' | 'workouts' | null>(null);

  useEffect(() => {
    meApi
      .getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    meApi.getMeasurements().then(setMeasurements).catch(() => {});
    meApi.getWorkoutHistory({ limit: 50 }).then(setWorkoutSessions).catch(() => {});
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
            Привет, {currentUser.client?.first_name || currentUser.first_name}! 💪
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
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div
                  onClick={() => setActiveChart(prev => prev === 'workouts' ? null : 'workouts')}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <StatCard
                    label="Тренировок в месяце"
                    value={stats?.sessions_this_month ?? '—'}
                    icon="📅"
                    color="#1e8e3e"
                  />
                  <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: '#ccc' }}>
                    {activeChart === 'workouts' ? '▴' : '▾'}
                  </span>
                </div>
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
                <div
                  onClick={() => setActiveChart(prev => prev === 'weight' ? null : 'weight')}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <StatCard
                    label="Текущий вес"
                    value={stats?.current_weight != null ? `${stats.current_weight} кг` : '—'}
                    icon="⚖️"
                    color="#9334e9"
                    subtitle={
                      stats?.weight_to_go != null && stats?.current_weight != null
                        ? `${stats.weight_to_go > 0 ? '+' : ''}${stats.weight_to_go.toFixed(1)} кг до цели`
                        : undefined
                    }
                    subtitleColor={
                      stats?.goal === 'weight_loss' ? '#1e8e3e'
                      : stats?.goal === 'weight_gain' ? '#2481cc'
                      : '#aaa'
                    }
                  />
                  <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: '#ccc' }}>
                    {activeChart === 'weight' ? '▴' : '▾'}
                  </span>
                </div>
              </div>
              {activeChart === 'weight' && <WeightMiniChart measurements={measurements} />}
              {activeChart === 'workouts' && <WorkoutsBarChart sessions={workoutSessions} />}
            </>
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

            <button
              onClick={() => navigate('/workout-history')}
              style={{
                background: '#fff',
                color: '#555',
                border: '2px solid #e0e0e0',
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
              <span style={{ fontSize: 24 }}>📋</span>
              <span>История тренировок</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
            </button>

            <button
              onClick={() => navigate('/edit-profile')}
              style={{
                background: '#fff',
                color: '#555',
                border: '2px solid #e0e0e0',
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
              <span style={{ fontSize: 24 }}>👤</span>
              <span>Мой профиль</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, opacity: 0.5 }}>›</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
