import { useEffect, useState } from 'react';
import { exercisesApi } from '../api/client';
import Layout from '../components/Layout';
import type { Exercise } from '../types';

const CATEGORY_LABELS: Record<string, string> = {
  chest_biceps: 'Грудь — Бицепс',
  back_triceps: 'Спина — Трицепс',
  legs_shoulders: 'Ноги — Плечи',
  full_body: 'Всё тело',
  functional: 'Функциональная',
  cardio: 'Кардио',
  hiit: 'ВИИТ',
  other: 'Другое',
};

const STRENGTH_CATEGORIES = [
  { value: 'chest_biceps', label: 'Грудь — Бицепс' },
  { value: 'back_triceps', label: 'Спина — Трицепс' },
  { value: 'legs_shoulders', label: 'Ноги — Плечи' },
  { value: 'full_body', label: 'Всё тело' },
  { value: 'other', label: 'Другое' },
];

const FUNCTIONAL_CATEGORIES = [
  { value: 'functional', label: 'Функциональная' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'hiit', label: 'ВИИТ' },
  { value: 'other', label: 'Другое' },
];

export default function ExerciseSettingsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWorkoutType, setNewWorkoutType] = useState<'strength' | 'functional'>('strength');
  const [newCategory, setNewCategory] = useState('chest_biceps');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'strength' | 'functional'>('strength');
  const [editCategory, setEditCategory] = useState('chest_biceps');
  const [editSaving, setEditSaving] = useState(false);

  const fetchExercises = () => {
    setLoading(true);
    exercisesApi
      .list()
      .then(setExercises)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Reset category when workout type changes
  const handleTypeChange = (type: 'strength' | 'functional') => {
    setNewWorkoutType(type);
    setNewCategory(type === 'strength' ? 'chest_biceps' : 'functional');
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      setAddError('Введите название упражнения');
      return;
    }
    setSaving(true);
    setAddError(null);
    try {
      await exercisesApi.create({
        name: newName.trim(),
        workout_type: newWorkoutType,
        category: newCategory,
        muscle_group: newMuscleGroup.trim() || undefined,
      });
      setNewName('');
      setNewMuscleGroup('');
      setShowAddForm(false);
      fetchExercises();
    } catch (err: any) {
      setAddError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStart = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditType((ex.workout_type as 'strength' | 'functional') || 'strength');
    setEditCategory(ex.category || 'other');
  };

  const handleEditTypeChange = (type: 'strength' | 'functional') => {
    setEditType(type);
    setEditCategory(type === 'strength' ? 'chest_biceps' : 'functional');
  };

  const handleEditSave = async (id: number) => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      await exercisesApi.update(id, { name: editName.trim(), workout_type: editType, category: editCategory });
      setEditingId(null);
      fetchExercises();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (ex: Exercise) => {
    if (!window.confirm(`Удалить "${ex.name}"?`)) return;
    try {
      await exercisesApi.delete(ex.id);
      fetchExercises();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Ошибка удаления');
    }
  };

  // Group exercises by type then category
  const strengthExercises = exercises.filter(e => e.workout_type === 'strength');
  const functionalExercises = exercises.filter(e => e.workout_type === 'functional');

  const groupByCategory = (list: Exercise[]) => {
    const map = new Map<string, Exercise[]>();
    for (const ex of list) {
      const cat = ex.category || 'other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ex);
    }
    return map;
  };

  const currentCategories = newWorkoutType === 'strength' ? STRENGTH_CATEGORIES : FUNCTIONAL_CATEGORIES;

  const renderExerciseGroup = (groupedMap: Map<string, Exercise[]>) => {
    return Array.from(groupedMap.entries()).map(([cat, exList]) => (
      <div key={cat} style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            padding: '6px 0 4px',
          }}
        >
          {CATEGORY_LABELS[cat] ?? cat}
        </div>
        {exList.map(ex => (
          <div
            key={ex.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #f5f5f5',
              gap: 8,
            }}
          >
            {editingId === ex.id ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1.5px solid #2481cc',
                    borderRadius: 8,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <select
                  value={editType}
                  onChange={e => handleEditTypeChange(e.target.value as 'strength' | 'functional')}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1.5px solid #e5e5ea',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="strength">Силовая</option>
                  <option value="functional">Функциональная</option>
                </select>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1.5px solid #e5e5ea',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  {(editType === 'strength' ? STRENGTH_CATEGORIES : FUNCTIONAL_CATEGORIES).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleEditSave(ex.id)}
                    disabled={editSaving}
                    style={{
                      flex: 2,
                      padding: '7px 0',
                      border: 'none',
                      borderRadius: 8,
                      background: '#1e8e3e',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      border: 'none',
                      borderRadius: 8,
                      background: '#e0e0e0',
                      color: '#555',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>{ex.name}</div>
                  {ex.muscle_group && (
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{ex.muscle_group}</div>
                  )}
                </div>
                <button
                  onClick={() => handleEditStart(ex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '4px 6px',
                    color: '#888',
                  }}
                  aria-label="Редактировать"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(ex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '4px 6px',
                    color: '#e53935',
                  }}
                  aria-label="Удалить"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <Layout title="Упражнения">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        {/* Add button */}
        <button
          onClick={() => setShowAddForm(v => !v)}
          style={{
            width: '100%',
            padding: '14px 20px',
            border: '2px solid #2481cc',
            borderRadius: 14,
            background: showAddForm ? '#e8f0fe' : '#fff',
            color: '#2481cc',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          ＋ Добавить упражнение
        </button>

        {/* Add form */}
        {showAddForm && (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Новое упражнение</div>

            {addError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#fce8e6',
                  borderRadius: 8,
                  color: '#c62828',
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                {addError}
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>Название *</div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Жим лёжа"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #e5e5ea',
                  borderRadius: 10,
                  fontSize: 16,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>Тип тренировки</div>
              <select
                value={newWorkoutType}
                onChange={e => handleTypeChange(e.target.value as 'strength' | 'functional')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #e5e5ea',
                  borderRadius: 10,
                  fontSize: 16,
                  background: '#fff',
                  outline: 'none',
                }}
              >
                <option value="strength">Силовая</option>
                <option value="functional">Функциональная</option>
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>Категория</div>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #e5e5ea',
                  borderRadius: 10,
                  fontSize: 16,
                  background: '#fff',
                  outline: 'none',
                }}
              >
                {currentCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>Мышечная группа (необязательно)</div>
              <input
                value={newMuscleGroup}
                onChange={e => setNewMuscleGroup(e.target.value)}
                placeholder="Грудь, трицепс..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #e5e5ea',
                  borderRadius: 10,
                  fontSize: 16,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAdd}
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
              <button
                onClick={() => { setShowAddForm(false); setAddError(null); }}
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
            </div>
          </div>
        )}

        {/* Exercise list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#e8e8e8', borderRadius: 12, height: 60 }} />
            ))}
          </div>
        ) : (
          <>
            {strengthExercises.length > 0 && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2481cc', marginBottom: 8 }}>
                  🏋️ Силовые
                </div>
                {renderExerciseGroup(groupByCategory(strengthExercises))}
              </div>
            )}

            {functionalExercises.length > 0 && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e37400', marginBottom: 8 }}>
                  ⚡ Функциональные
                </div>
                {renderExerciseGroup(groupByCategory(functionalExercises))}
              </div>
            )}

            {exercises.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                Упражнений пока нет
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
