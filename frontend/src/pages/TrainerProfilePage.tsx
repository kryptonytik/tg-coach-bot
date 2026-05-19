import { useEffect, useState } from 'react';
import { trainerApi, clientsApi } from '../api/client';
import Layout from '../components/Layout';

const GOAL_OPTIONS = [
  { value: 'weight_gain', label: 'Набор массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'maintenance', label: 'Поддержание' },
];

export default function TrainerProfilePage() {
  const [selfClient, setSelfClient] = useState<any>(null);
  const [goal, setGoal] = useState('maintenance');
  const [targetWeight, setTargetWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

            {/* Goal */}
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

            {/* Target weight */}
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
