import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutsApi } from '../api/client';
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
    weekday: 'long',
  });
}

interface SessionDetail {
  id: number;
  date: string;
  workout_type: string;
  category: string | null;
  is_completed: boolean;
  exercises: Array<{
    exercise_id: number;
    exercise_name: string;
    muscle_group: string | null;
    sets: Array<{
      id: number;
      set_number: number;
      weight: number | null;
      reps: number | null;
      notes: string | null;
    }>;
  }>;
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = parseInt(id || '0', 10);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Удалить эту тренировку? Действие нельзя отменить.')) return;
    setDeleting(true);
    try {
      await workoutsApi.deleteSession(sessionId);
      navigate(-1);
    } catch {
      alert('Не удалось удалить тренировку');
      setDeleting(false);
    }
  }

  useEffect(() => {
    workoutsApi
      .getSessionDetail(sessionId)
      .then(setDetail)
      .catch((err: any) => setError(err?.response?.data?.error || err?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <Layout title="Тренировка">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
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
      </Layout>
    );
  }

  if (error || !detail) {
    return (
      <Layout title="Тренировка">
        <div style={{ padding: 16, background: '#fce8e6', borderRadius: 12, color: '#c62828' }}>
          {error || 'Не удалось загрузить данные'}
        </div>
      </Layout>
    );
  }

  const typeLabel = WORKOUT_TYPE_LABELS[detail.workout_type] ?? detail.workout_type;
  const catLabel = detail.category ? (CATEGORY_LABELS[detail.category] ?? detail.category) : null;

  return (
    <Layout title="Детали тренировки">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2481cc 0%, #1a6bb5 100%)',
            borderRadius: 14,
            padding: '16px 18px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{formatDate(detail.date)}</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {typeLabel}{catLabel ? ` · ${catLabel}` : ''}
          </div>
          {detail.is_completed && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>✅ Завершена</div>
          )}
        </div>

        {/* Exercise groups */}
        {detail.exercises.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>
            Нет записей
          </div>
        ) : (
          detail.exercises.map(group => (
            <div
              key={group.exercise_id}
              style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: '#000', marginBottom: 2 }}>
                {group.exercise_name}
              </div>
              {group.muscle_group && (
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
                  {group.muscle_group}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.sets.map(s => (
                  <div
                    key={s.id}
                    style={{
                      fontSize: 14,
                      color: '#333',
                      padding: '6px 0',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <span style={{ color: '#888', marginRight: 8 }}>Сет {s.set_number}:</span>
                    <span style={{ fontWeight: 600 }}>
                      {s.weight != null ? `${s.weight} кг` : '—'} × {s.reps != null ? `${s.reps} повт.` : '—'}
                    </span>
                    {s.notes && (
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{s.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: '#fff',
            color: '#c62828',
            border: '2px solid #c62828',
            borderRadius: 14,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: deleting ? 0.6 : 1,
            width: '100%',
          }}
        >
          🗑️ {deleting ? 'Удаление...' : 'Удалить тренировку'}
        </button>
      </div>
    </Layout>
  );
}
