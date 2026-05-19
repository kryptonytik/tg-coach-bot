import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi, workoutsApi, exercisesApi, trainerApi } from '../api/client';
import GoalBadge from '../components/GoalBadge';
import ExerciseSetRow from '../components/ExerciseSetRow';
import Layout from '../components/Layout';
import type { Client, CurrentUser, Exercise, WorkoutSession, WorkoutSet, WorkoutType } from '../types';

type FlowStep = 'SELECT_CLIENT' | 'CHECK_ACTIVE' | 'SELECT_TYPE' | 'SELECT_CATEGORY' | 'RECORD_SETS' | 'DONE';

const STRENGTH_CATEGORIES = [
  { value: 'chest_biceps', label: 'Грудь — Бицепс' },
  { value: 'back_triceps', label: 'Спина — Трицепс' },
  { value: 'legs_shoulders', label: 'Ноги — Плечи' },
  { value: 'full_body', label: 'Всё тело' },
];

const FUNCTIONAL_CATEGORIES = [
  { value: 'functional', label: 'Функциональный' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'hiit', label: 'ВИИТ' },
];

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  functional: 'Функциональная',
};

function categoryLabel(cat: string | null): string {
  if (!cat) return '';
  const all = [...STRENGTH_CATEGORIES, ...FUNCTIONAL_CATEGORIES];
  return all.find(c => c.value === cat)?.label || cat;
}

// Group sets by exercise
function groupSetsByExercise(sets: WorkoutSet[]): Map<number, WorkoutSet[]> {
  const map = new Map<number, WorkoutSet[]>();
  for (const s of sets) {
    if (!map.has(s.exercise_id)) map.set(s.exercise_id, []);
    map.get(s.exercise_id)!.push(s);
  }
  return map;
}

interface Props {
  currentUser: CurrentUser;
}

export default function WorkoutFlow({ currentUser }: Props) {
  const navigate = useNavigate();
  const isClientMode = currentUser.role === 'client';
  const [step, setStep] = useState<FlowStep>(isClientMode ? 'CHECK_ACTIVE' : 'SELECT_CLIENT');

  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    isClientMode ? currentUser.client : null
  );
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [category, setCategory] = useState<string>('');
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isResumingSession, setIsResumingSession] = useState(false);

  // Exercise recording state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients on mount (trainer mode only)
  useEffect(() => {
    if (isClientMode) {
      setClientsLoading(false);
      return;
    }
    clientsApi.list(true)
      .then(setClients)
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, [isClientMode]);

  // For client mode: check active session on mount
  useEffect(() => {
    if (!isClientMode || !currentUser.client) return;
    handleSelectClient(currentUser.client);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load exercises when entering RECORD_SETS
  const loadExercises = useCallback(async (type: WorkoutType, cat: string) => {
    setExercisesLoading(true);
    try {
      const data = await exercisesApi.list({ type, category: cat });
      setExercises(data);
    } catch {
      setExercises([]);
    } finally {
      setExercisesLoading(false);
    }
  }, []);

  // Load exercise history when exercise is selected
  const loadHistory = useCallback(async (clientId: number, exerciseId: number) => {
    setHistoryLoading(true);
    try {
      const data = await workoutsApi.getExerciseHistory(clientId, exerciseId);
      setExerciseHistory(data);
    } catch {
      setExerciseHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Step: select client
  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setStep('CHECK_ACTIVE');
    setError(null);
    try {
      const { session: activeSession } = await trainerApi.getActiveSession(client.id);
      if (activeSession) {
        setSession(activeSession);
        setWorkoutType(activeSession.workout_type);
        setCategory(activeSession.category || '');
        setSessionSets(activeSession.sets || []);
        setIsResumingSession(true);
        await loadExercises(activeSession.workout_type, activeSession.category || '');
        setStep('RECORD_SETS');
      } else {
        setIsResumingSession(false);
        setStep('SELECT_TYPE');
      }
    } catch {
      setIsResumingSession(false);
      setStep('SELECT_TYPE');
    }
  };

  // Step: select type
  const handleSelectType = (type: WorkoutType) => {
    setWorkoutType(type);
    setCategory('');
    setStep('SELECT_CATEGORY');
  };

  // Step: select category → create session
  const handleSelectCategory = async (cat: string) => {
    setCategory(cat);
    setError(null);
    try {
      const newSession = await workoutsApi.createSession({
        client_id: selectedClient!.id,
        workout_type: workoutType,
        category: cat,
      });
      setSession(newSession);
      setSessionSets(newSession.sets || []);
      await loadExercises(workoutType, cat);
      setStep('RECORD_SETS');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка создания сессии');
    }
  };

  // Pick exercise
  const handlePickExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
    if (selectedClient) {
      await loadHistory(selectedClient.id, exercise.id);
    }
  };

  // Add set
  const handleAddSet = async (weight: number | null, reps: number | null) => {
    if (!session || !selectedExercise) return;
    const currentSetsForExercise = sessionSets.filter(s => s.exercise_id === selectedExercise.id);
    const setNumber = currentSetsForExercise.length + 1;
    try {
      const newSet = await workoutsApi.addSet(session.id, {
        exercise_id: selectedExercise.id,
        set_number: setNumber,
        weight,
        reps,
      });
      setSessionSets(prev => [...prev, newSet]);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка добавления сета');
    }
  };

  // Delete set
  const handleDeleteSet = async (setId: number) => {
    if (!session) return;
    try {
      await workoutsApi.deleteSet(session.id, setId);
      setSessionSets(prev => prev.filter(s => s.id !== setId));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка удаления');
    }
  };

  // Complete workout
  const handleComplete = async () => {
    if (!session) return;
    setCompleting(true);
    setError(null);
    try {
      await workoutsApi.updateSession(session.id, { is_completed: true });
      setStep('DONE');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка завершения');
    } finally {
      setCompleting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q)
    );
  });

  const groupedSets = groupSetsByExercise(sessionSets);

  // ---- RENDER ----

  if (step === 'DONE') {
    return (
      <Layout title="Тренировка завершена">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, padding: '40px 0' }}>
          <div style={{ fontSize: 72 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
            Тренировка записана!
          </div>
          <div style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>
            {selectedClient?.first_name} — {WORKOUT_TYPE_LABELS[workoutType]}, {categoryLabel(category)}
          </div>
          <div style={{ fontSize: 14, color: '#aaa' }}>
            Подходов: {sessionSets.length}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 16,
              padding: '14px 40px',
              background: '#2481cc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            На главную
          </button>
        </div>
      </Layout>
    );
  }

  if (step === 'SELECT_CLIENT') {
    return (
      <Layout title="Выберите подопечного">
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              fontSize: 15,
              boxSizing: 'border-box',
              background: '#fff',
            }}
            autoFocus
          />
        </div>
        {clientsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#e8e8e8', borderRadius: 12, height: 64 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredClients.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>
                Нет подопечных
              </div>
            )}
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
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
                  minHeight: 60,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#2481cc',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {client.first_name[0]}{client.last_name?.[0] || ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#000' }}>
                    {client.first_name} {client.last_name || ''}
                  </div>
                  <div style={{ marginTop: 3 }}>
                    <GoalBadge goal={client.goal} />
                  </div>
                </div>
                <span style={{ color: '#ccc', fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  if (step === 'CHECK_ACTIVE') {
    return (
      <Layout title="Проверка...">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: '#888' }}>
          Проверяем активную тренировку...
        </div>
      </Layout>
    );
  }

  if (step === 'SELECT_TYPE') {
    return (
      <Layout title="Тип тренировки">
        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0f7ff', borderRadius: 10 }}>
          <span style={{ fontSize: 14, color: '#2481cc', fontWeight: 600 }}>
            {selectedClient?.first_name} {selectedClient?.last_name || ''}
          </span>
        </div>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleSelectType('strength')}
            style={{
              padding: '24px 20px',
              border: '2px solid #e0e0e0',
              borderRadius: 16,
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 36 }}>🏋️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#000' }}>Силовая</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Работа с весами и тренажёрами</div>
            </div>
          </button>
          <button
            onClick={() => handleSelectType('functional')}
            style={{
              padding: '24px 20px',
              border: '2px solid #e0e0e0',
              borderRadius: 16,
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 36 }}>⚡</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#000' }}>Функциональная</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Кардио, ВИИТ, функциональные упражнения</div>
            </div>
          </button>
        </div>
      </Layout>
    );
  }

  if (step === 'SELECT_CATEGORY') {
    const categories = workoutType === 'strength' ? STRENGTH_CATEGORIES : FUNCTIONAL_CATEGORIES;
    return (
      <Layout title="Группа мышц / тип">
        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f0f7ff', borderRadius: 10 }}>
          <span style={{ fontSize: 14, color: '#2481cc', fontWeight: 600 }}>
            {selectedClient?.first_name} · {WORKOUT_TYPE_LABELS[workoutType]}
          </span>
        </div>
        {error && (
          <div style={{ padding: '10px 14px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleSelectCategory(cat.value)}
              style={{
                padding: '18px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: 14,
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 16,
                fontWeight: 600,
                color: '#000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 56,
              }}
            >
              {cat.label}
              <span style={{ color: '#ccc', fontSize: 20 }}>›</span>
            </button>
          ))}
        </div>
      </Layout>
    );
  }

  // RECORD_SETS
  const currentExerciseSets = selectedExercise
    ? sessionSets.filter(s => s.exercise_id === selectedExercise.id)
    : [];

  return (
    <Layout title="Запись тренировки">
      {/* Session header */}
      <div
        style={{
          background: isResumingSession
            ? 'linear-gradient(135deg, #e37400 0%, #c96200 100%)'
            : 'linear-gradient(135deg, #2481cc 0%, #1a6bb5 100%)',
          borderRadius: 14,
          padding: '14px 16px',
          color: '#fff',
          marginBottom: 16,
        }}
      >
        {isResumingSession && (
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Продолжаем тренировку от сегодня
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {selectedClient?.first_name} {selectedClient?.last_name || ''}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
          {WORKOUT_TYPE_LABELS[workoutType]} · {categoryLabel(category)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
          {session && new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Exercise picker button */}
      <button
        onClick={() => setShowExercisePicker(v => !v)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '2px dashed #2481cc',
          borderRadius: 12,
          background: '#f0f7ff',
          color: '#2481cc',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span>
          {selectedExercise ? selectedExercise.name : '+ Выбрать упражнение'}
        </span>
        <span style={{ fontSize: 18, transform: showExercisePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {/* Exercise list (picker) */}
      {showExercisePicker && (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            marginBottom: 14,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {exercisesLoading ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>Загрузка...</div>
          ) : exercises.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>Нет упражнений</div>
          ) : (
            exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => handlePickExercise(ex)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid #f5f5f5',
                  background: selectedExercise?.id === ex.id ? '#e8f0fe' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  color: '#000',
                  fontWeight: selectedExercise?.id === ex.id ? 600 : 400,
                }}
              >
                <div>{ex.name}</div>
                {ex.muscle_group && (
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{ex.muscle_group}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected exercise panel */}
      {selectedExercise && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{selectedExercise.name}</div>

          {/* Previous workout history */}
          {historyLoading ? (
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 10 }}>Загрузка истории...</div>
          ) : exerciseHistory.length > 0 && (
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Прошлая тренировка ({new Date(exerciseHistory[0].date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}):
              </div>
              {exerciseHistory[0].sets.map((s: any) => (
                <div key={s.set_number} style={{ color: '#777' }}>
                  Сет {s.set_number}: {s.weight != null ? `${s.weight}кг` : '—'}×{s.reps != null ? s.reps : '—'} повт.
                </div>
              ))}
            </div>
          )}

          {/* Add set row */}
          <ExerciseSetRow
            setNumber={currentExerciseSets.length + 1}
            onSave={handleAddSet}
          />

          {/* Current sets */}
          {currentExerciseSets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {currentExerciseSets.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #f5f5f5',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: '#888', width: 20 }}>#{s.set_number}</span>
                  <span style={{ flex: 1, marginLeft: 8, fontWeight: 600 }}>
                    {s.weight != null ? `${s.weight} кг` : '—'} × {s.reps != null ? s.reps : '—'} повт.
                  </span>
                  <button
                    onClick={() => handleDeleteSet(s.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ccc',
                      fontSize: 18,
                      padding: '4px 6px',
                      minWidth: 36,
                      minHeight: 36,
                    }}
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All logged sets summary */}
      {sessionSets.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#888', marginBottom: 8 }}>
            Все подходы ({sessionSets.length})
          </div>
          {Array.from(groupedSets.entries()).map(([exId, sets]) => (
            <div key={exId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#000', marginBottom: 4 }}>
                {sets[0].exercise_name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sets.map(s => (
                  <span
                    key={s.id}
                    style={{
                      background: '#f0f7ff',
                      color: '#2481cc',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    #{s.set_number} {s.weight != null ? `${s.weight}кг` : '—'}×{s.reps ?? '—'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={completing || sessionSets.length === 0}
        style={{
          width: '100%',
          padding: '16px',
          border: 'none',
          borderRadius: 14,
          background: completing || sessionSets.length === 0 ? '#aaa' : '#1e8e3e',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: completing || sessionSets.length === 0 ? 'not-allowed' : 'pointer',
          marginTop: 8,
          boxShadow: sessionSets.length > 0 ? '0 2px 8px rgba(30,142,62,0.3)' : 'none',
        }}
      >
        {completing ? 'Завершение...' : '✅ Завершить тренировку'}
      </button>
      {sessionSets.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 6 }}>
          Добавьте хотя бы один подход
        </div>
      )}
    </Layout>
  );
}
