import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/client';
import { useApi } from '../hooks/useApi';
import GoalBadge from '../components/GoalBadge';
import Layout from '../components/Layout';
import type { Client, Goal } from '../types';

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'weight_gain', label: 'Набор массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'maintenance', label: 'Поддержание' },
];

function AccordionSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: '#000',
        }}
      >
        {title}
        <span style={{ fontSize: 18, color: '#aaa', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f0f0f0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 12 }}>
      <span style={{ fontSize: 13, color: '#888', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#000', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function FitnessLevelBar({ level }: { level: number }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
        <span>Уровень подготовки</span>
        <span>{level} / 10</span>
      </div>
      <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${level * 10}%`,
            background: '#2481cc',
            borderRadius: 4,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = parseInt(id || '0', 10);

  const { data: client, loading, error, refetch } = useApi<Client>(
    () => clientsApi.get(clientId),
    [clientId]
  );

  const [editing, setEditing] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal>('maintenance');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = () => {
    if (client) {
      setEditGoal(client.goal);
      setEditActive(client.is_active);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await clientsApi.update(clientId, { goal: editGoal, is_active: editActive });
      setEditing(false);
      refetch();
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || err?.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Деактивировать подопечного?')) return;
    try {
      await clientsApi.deactivate(clientId);
      navigate('/clients');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) {
    return (
      <Layout title="Профиль">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: '#e8e8e8', borderRadius: 12, height: 80 }} />
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Профиль">
        <div style={{ padding: 16, background: '#fce8e6', borderRadius: 12, color: '#c62828' }}>{error}</div>
      </Layout>
    );
  }

  if (!client) return null;

  const q = client.questionnaire;
  const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ');
  const createdDate = new Date(client.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout
      title={fullName}
      rightAction={
        !editing ? (
          <button
            onClick={startEdit}
            style={{
              background: 'none',
              border: 'none',
              color: '#2481cc',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            Изменить
          </button>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: client.is_active ? '#2481cc' : '#ccc',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {client.first_name[0]}{client.last_name?.[0] || ''}
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#000' }}>{fullName}</div>
              <div style={{ marginTop: 4 }}>
                <GoalBadge goal={client.goal} />
              </div>
            </div>
          </div>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              style={{ display: 'block', fontSize: 14, color: '#2481cc', marginBottom: 6, textDecoration: 'none' }}
            >
              📞 {client.phone}
            </a>
          )}
          {client.telegram_username && (
            <a
              href={`https://t.me/${client.telegram_username}`}
              style={{ color: '#2481cc', textDecoration: 'none', display: 'block', fontSize: 14, marginBottom: 6 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{client.telegram_username} →
            </a>
          )}
          <div style={{ fontSize: 12, color: '#aaa' }}>Добавлен {createdDate}</div>
          {!client.is_active && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#888' }}>
              Неактивный
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Редактирование</div>
            {saveError && (
              <div style={{ padding: '8px 12px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13, marginBottom: 12 }}>
                {saveError}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Цель</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditGoal(opt.value)}
                    style={{
                      padding: '8px',
                      border: `2px solid ${editGoal === opt.value ? '#2481cc' : '#e0e0e0'}`,
                      borderRadius: 8,
                      background: editGoal === opt.value ? '#e8f0fe' : '#fff',
                      color: editGoal === opt.value ? '#2481cc' : '#555',
                      fontSize: 12,
                      fontWeight: editGoal === opt.value ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Статус</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, l: 'Активный' }, { v: false, l: 'Неактивный' }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    onClick={() => setEditActive(v)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: `2px solid ${editActive === v ? '#2481cc' : '#e0e0e0'}`,
                      borderRadius: 8,
                      background: editActive === v ? '#e8f0fe' : '#fff',
                      color: editActive === v ? '#2481cc' : '#555',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#555',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '12px',
                  border: 'none',
                  borderRadius: 10,
                  background: saving ? '#aaa' : '#2481cc',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}

        {/* Questionnaire */}
        {q && (
          <>
            <AccordionSection title="Физическая подготовка" defaultOpen>
              {q.fitness_level != null && <FitnessLevelBar level={q.fitness_level} />}
              <div style={{ marginTop: 8 }}>
                <InfoRow label="Тренировался раньше" value={q.had_training_before === true ? 'Да' : q.had_training_before === false ? 'Нет' : null} />
                <InfoRow label="Чем занимался" value={q.previous_sports} />
                <InfoRow label="С последней тренировки" value={q.time_since_last_workout} />
              </div>
            </AccordionSection>

            <AccordionSection title="Здоровье">
              <InfoRow label="Боли в суставах" value={q.joint_pain} />
              <InfoRow label="Давление" value={q.pressure_issues} />
              <InfoRow label="Операции" value={q.surgeries} />
              <InfoRow label="Патологии" value={q.congenital_conditions} />
              <InfoRow label="Проблемы с ЖКТ" value={q.gi_issues} />
              <InfoRow label="Позвоночник" value={q.spine_conditions} />
              <InfoRow label="Боли в груди" value={q.chest_pain} />
              {!q.joint_pain && !q.pressure_issues && !q.surgeries && !q.congenital_conditions && !q.gi_issues && !q.spine_conditions && !q.chest_pain && (
                <div style={{ padding: '10px 0', fontSize: 13, color: '#aaa' }}>Нет данных о здоровье</div>
              )}
            </AccordionSection>

            <AccordionSection title="Параметры">
              <InfoRow label="Возраст" value={q.age != null ? `${q.age} лет` : null} />
              <InfoRow label="Рост" value={q.height != null ? `${q.height} см` : null} />
              <InfoRow label="Вес" value={q.weight != null ? `${q.weight} кг` : null} />
              <InfoRow label="Добавки" value={q.supplements} />
            </AccordionSection>
          </>
        )}

        {/* Actions */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => navigate('/workout')}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: 12,
              background: '#2481cc',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            🏋️ Записать тренировку
          </button>
          {client.is_active && (
            <button
              onClick={handleDeactivate}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 12,
                background: '#fff',
                color: '#999',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Деактивировать
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
