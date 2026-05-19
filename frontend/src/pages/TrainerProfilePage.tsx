import { useEffect, useState } from 'react';
import { trainerApi, clientsApi, meApi } from '../api/client';
import Layout from '../components/Layout';

const GOAL_OPTIONS = [
  { value: 'weight_gain', label: 'Набор массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'maintenance', label: 'Поддержание' },
];

function WeightMiniChart({ measurements }: { measurements: any[] }) {
  const pts = [...measurements]
    .filter(m => m.weight != null)
    .reverse()
    .slice(0, 6);
  if (pts.length < 2)
    return (
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
    <div style={{ marginTop: 8 }}>
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
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6 }}>Тренировки по неделям</div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ width: '100%', height: 80, overflow: 'visible' }}>
        {weeks.map((week, i) => {
          const barH = Math.max((week.count / max) * H, week.count > 0 ? 4 : 0);
          const x = padL + i * (bw + gap);
          const y = H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={barH || 2} rx="4"
                fill={i === 3 ? '#9334e9' : '#d8b4fe'} />
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

export default function TrainerProfilePage() {
  const [selfClient, setSelfClient] = useState<any>(null);
  const [goal, setGoal] = useState('maintenance');
  const [targetWeight, setTargetWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [addingWeight, setAddingWeight] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    trainerApi
      .getMyClientProfile()
      .then((data: any) => {
        setSelfClient(data);
        setGoal(data.goal || 'maintenance');
        setTargetWeight(data.target_weight != null ? String(data.target_weight) : '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    meApi.getMeasurements().then(setMeasurements).catch(() => {});
    trainerApi.getMyWorkoutHistory({ limit: 50 }).then(setWorkoutHistory).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selfClient) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await clientsApi.update(selfClient.id, {
        goal,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      });
      setSuccess(true);
      fetchProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWeight = async () => {
    const w = parseFloat(weightInput);
    if (!weightInput || isNaN(w)) return;
    setAddingWeight(true);
    try {
      await meApi.addMeasurement({ weight: w });
      setWeightInput('');
      const updated = await meApi.getMeasurements();
      setMeasurements(updated);
    } catch {
      alert('Не удалось сохранить замер');
    } finally {
      setAddingWeight(false);
    }
  };

  const lastWeight = measurements.find(m => m.weight != null)?.weight;

  return (
    <Layout title="Мой профиль">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #9334e9 0%, #7b1fa2 100%)',
            borderRadius: 16,
            padding: '20px 20px 16px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Мой профиль 💪
          </div>
          {selfClient && (
            <div style={{ fontSize: 15, opacity: 0.9 }}>
              {selfClient.first_name} {selfClient.last_name || ''}
            </div>
          )}
        </div>

        {/* Measurements section */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            padding: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Вес и замеры</div>

          {lastWeight != null && (
            <div style={{ fontSize: 28, fontWeight: 700, color: '#9334e9', marginBottom: 4 }}>
              {lastWeight} <span style={{ fontSize: 16, color: '#888', fontWeight: 400 }}>кг</span>
            </div>
          )}

          <WeightMiniChart measurements={measurements} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Вес (кг)"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 16,
                background: '#fff',
                color: '#000',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddWeight}
              disabled={addingWeight || !weightInput}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: 10,
                background: '#9334e9',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: addingWeight || !weightInput ? 'not-allowed' : 'pointer',
                opacity: !weightInput ? 0.5 : 1,
              }}
            >
              {addingWeight ? '...' : 'Добавить'}
            </button>
          </div>
        </div>

        {/* Workout frequency chart */}
        {workoutHistory.length > 0 && (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Частота тренировок</div>
            <WorkoutsBarChart sessions={workoutHistory} />
          </div>
        )}

        {/* Goal & target weight settings */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: '#e8e8e8', borderRadius: 12, height: 80 }} />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Настройки</div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: '#fce8e6',
                  borderRadius: 8,
                  color: '#c62828',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>Цель</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    style={{
                      padding: '10px 8px',
                      border: `2px solid ${goal === opt.value ? '#9334e9' : '#e0e0e0'}`,
                      borderRadius: 10,
                      background: goal === opt.value ? '#f3e8ff' : '#fff',
                      color: goal === opt.value ? '#9334e9' : '#555',
                      fontSize: 13,
                      fontWeight: goal === opt.value ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                Целевой вес (кг)
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                placeholder="70"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 10,
                  fontSize: 16,
                  background: '#fff',
                  boxSizing: 'border-box',
                  color: '#000',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: 10,
                background: saving ? '#aaa' : success ? '#1e8e3e' : '#9334e9',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Сохранение...' : success ? 'Сохранено! ✓' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
