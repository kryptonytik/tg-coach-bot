import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainerApi } from '../api/client';
import Layout from '../components/Layout';

const CATEGORY_LABELS: Record<string, string> = {
  chest_biceps: 'Грудь — Бицепс',
  back_triceps: 'Спина — Трицепс',
  legs_shoulders: 'Ноги — Плечи',
  full_body: 'Всё тело',
  functional: 'Функциональная',
  cardio: 'Кардио',
  hiit: 'ВИИТ',
};

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  strength: 'Силовая',
  functional: 'Функциональная',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}

function WorkoutTypeBadge({ type }: { type: string }) {
  const isStrength = type === 'strength';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: isStrength ? '#e8f0fe' : '#fff3e0',
        color: isStrength ? '#2481cc' : '#e37400',
      }}
    >
      {WORKOUT_TYPE_LABELS[type] ?? type}
    </span>
  );
}

export default function TrainerWorkoutHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainerApi
      .getMyWorkoutHistory()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Мои тренировки">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#e8e8e8', borderRadius: 12, height: 90 }} />
            ))}
          </>
        ) : sessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: '#888',
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
            <div>Тренировок пока нет — запиши первую через «Моя тренировка»</div>
          </div>
        ) : (
          sessions.map(session => {
            const setCount: number = session.sets?.length ?? session.sets_count ?? 0;
            const exerciseCount: number =
              session.exercises_count ??
              (session.sets
                ? new Set(session.sets.map((s: any) => s.exercise_id)).size
                : 0);
            const categoryLabel = session.category
              ? (CATEGORY_LABELS[session.category] ?? session.category)
              : null;

            return (
              <div
                key={session.id}
                onClick={() => navigate('/workout-detail/' + session.id)}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
                onPointerDown={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
                onPointerUp={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                onPointerLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#444',
                    marginBottom: 8,
                  }}
                >
                  {formatDate(session.date)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <WorkoutTypeBadge type={session.workout_type} />
                  {categoryLabel && (
                    <span style={{ fontSize: 13, color: '#666' }}>{categoryLabel}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>
                  {setCount} {setCount === 1 ? 'подход' : setCount >= 2 && setCount <= 4 ? 'подхода' : 'подходов'}
                  {exerciseCount > 0 && (
                    <>
                      {' · '}
                      {exerciseCount} {exerciseCount === 1 ? 'упражнение' : exerciseCount >= 2 && exerciseCount <= 4 ? 'упражнения' : 'упражнений'}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
