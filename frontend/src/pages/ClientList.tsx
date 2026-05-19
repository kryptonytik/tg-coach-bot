import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/client';
import { useApi } from '../hooks/useApi';
import GoalBadge from '../components/GoalBadge';
import Layout from '../components/Layout';
import type { Client } from '../types';

function getClientStatus(lastWorkoutDate?: string | null) {
  if (!lastWorkoutDate) return { emoji: '🔴', label: 'Давно не было' };
  const days = Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000);
  if (days <= 7) return { emoji: '🟢', label: 'В ритме' };
  if (days <= 14) return { emoji: '🟡', label: 'Редко приходит' };
  return { emoji: '🔴', label: 'Давно не было' };
}

export default function ClientList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'active' | 'all'>('active');

  const { data: clients, loading, error } = useApi<Client[]>(
    () => (tab === 'active' ? clientsApi.list(true) : clientsApi.list()),
    [tab]
  );

  return (
    <Layout title="Подопечные">
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: '#f0f2f5',
          borderRadius: 10,
          padding: 3,
          marginBottom: 16,
        }}
      >
        {(['active', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#2481cc' : '#888',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t === 'active' ? 'Активные' : 'Все'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                background: '#e8e8e8',
                borderRadius: 12,
                height: 72,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            background: '#fce8e6',
            borderRadius: 12,
            color: '#c62828',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && clients && (
        <>
          {clients.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 15 }}>
                {tab === 'active' ? 'Нет активных подопечных' : 'Нет подопечных'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    padding: '14px 16px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 64,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: client.is_active ? '#2481cc' : '#ccc',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {client.first_name[0]}
                    {client.last_name?.[0] || ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {client.first_name} {client.last_name || ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <GoalBadge goal={client.goal} />
                      {client.questionnaire?.fitness_level != null && (
                        <span style={{ fontSize: 12, color: '#888' }}>
                          Уровень: {client.questionnaire.fitness_level}/10
                        </span>
                      )}
                    </div>
                    {(() => {
                      const status = getClientStatus(client.last_workout_date);
                      return (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          {status.emoji} {status.label}
                        </div>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: 20, color: '#ccc' }}>›</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/clients/add')}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#2481cc',
          color: '#fff',
          border: 'none',
          fontSize: 26,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(36,129,204,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}
        aria-label="Добавить подопечного"
      >
        +
      </button>
    </Layout>
  );
}
