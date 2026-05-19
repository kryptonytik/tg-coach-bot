import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/client';
import Layout from '../components/Layout';
import type { Goal } from '../types';

const TOTAL_STEPS = 4;

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'weight_gain', label: 'Набор массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'maintenance', label: 'Поддержание' },
];

interface FormData {
  // Step 1
  first_name: string;
  last_name: string;
  phone: string;
  goal: Goal;
  // Step 2
  had_training_before: boolean | null;
  previous_sports: string;
  time_since_last_workout: string;
  fitness_level: number;
  // Step 3
  joint_pain: string;
  pressure_issues: string;
  surgeries: string;
  congenital_conditions: string;
  gi_issues: string;
  spine_conditions: string;
  chest_pain: string;
  // Step 4
  supplements: string;
  age: string;
  height: string;
  weight: string;
}

const initialForm: FormData = {
  first_name: '',
  last_name: '',
  phone: '',
  goal: 'maintenance',
  had_training_before: null,
  previous_sports: '',
  time_since_last_workout: '',
  fitness_level: 5,
  joint_pain: '',
  pressure_issues: '',
  surgeries: '',
  congenital_conditions: '',
  gi_issues: '',
  spine_conditions: '',
  chest_pain: '',
  supplements: '',
  age: '',
  height: '',
  weight: '',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #e0e0e0',
  borderRadius: 10,
  fontSize: 15,
  background: '#fff',
  boxSizing: 'border-box',
  color: '#000',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#555',
  marginBottom: 6,
  display: 'block',
};

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: '#999' }}>{hint}</span>}
    </div>
  );
}

export default function AddClient() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormData, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.first_name.trim()) {
        setError('Введите имя');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        goal: form.goal,
        questionnaire: {
          had_training_before: form.had_training_before,
          previous_sports: form.previous_sports || null,
          time_since_last_workout: form.time_since_last_workout || null,
          fitness_level: form.fitness_level,
          joint_pain: form.joint_pain || null,
          pressure_issues: form.pressure_issues || null,
          surgeries: form.surgeries || null,
          congenital_conditions: form.congenital_conditions || null,
          gi_issues: form.gi_issues || null,
          spine_conditions: form.spine_conditions || null,
          chest_pain: form.chest_pain || null,
          supplements: form.supplements || null,
          age: form.age ? parseInt(form.age, 10) : null,
          height: form.height ? parseFloat(form.height) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
        },
      };
      await clientsApi.create(payload);
      navigate('/clients');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Основная информация',
    'Активность',
    'Здоровье',
    'Параметры',
  ];

  return (
    <Layout title={`Новый подопечный — ${stepTitles[step - 1]}`}>
      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              width: i + 1 === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i + 1 <= step ? '#2481cc' : '#d0d0d0',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fce8e6',
            borderRadius: 8,
            color: '#c62828',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Step 1 */}
        {step === 1 && (
          <>
            <FieldGroup label="Имя *">
              <input
                style={inputStyle}
                type="text"
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Александр"
                autoFocus
              />
            </FieldGroup>
            <FieldGroup label="Фамилия">
              <input
                style={inputStyle}
                type="text"
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="Иванов"
              />
            </FieldGroup>
            <FieldGroup label="Телефон">
              <input
                style={inputStyle}
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+7 900 000 0000"
              />
            </FieldGroup>
            <FieldGroup label="Цель *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set('goal', opt.value)}
                    style={{
                      padding: '10px 8px',
                      border: `2px solid ${form.goal === opt.value ? '#2481cc' : '#e0e0e0'}`,
                      borderRadius: 10,
                      background: form.goal === opt.value ? '#e8f0fe' : '#fff',
                      color: form.goal === opt.value ? '#2481cc' : '#555',
                      fontSize: 13,
                      fontWeight: form.goal === opt.value ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <FieldGroup label="Занимались спортом раньше?">
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, l: 'Да' }, { v: false, l: 'Нет' }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    onClick={() => set('had_training_before', v)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${form.had_training_before === v ? '#2481cc' : '#e0e0e0'}`,
                      borderRadius: 10,
                      background: form.had_training_before === v ? '#e8f0fe' : '#fff',
                      color: form.had_training_before === v ? '#2481cc' : '#555',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </FieldGroup>
            {form.had_training_before && (
              <FieldGroup label="Чем занимались?">
                <input
                  style={inputStyle}
                  type="text"
                  value={form.previous_sports}
                  onChange={e => set('previous_sports', e.target.value)}
                  placeholder="Футбол, плавание..."
                />
              </FieldGroup>
            )}
            <FieldGroup label="Сколько времени с последней тренировки?">
              <input
                style={inputStyle}
                type="text"
                value={form.time_since_last_workout}
                onChange={e => set('time_since_last_workout', e.target.value)}
                placeholder="1 год, 3 месяца..."
              />
            </FieldGroup>
            <FieldGroup label={`Физическая подготовка: ${form.fitness_level} / 10`}>
              <input
                type="range"
                min={1}
                max={10}
                value={form.fitness_level}
                onChange={e => set('fitness_level', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2481cc' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
                <span>Начинающий</span>
                <span>Продвинутый</span>
              </div>
            </FieldGroup>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <FieldGroup label="Боли в суставах (колени/локти)?">
              <input
                style={inputStyle}
                type="text"
                value={form.joint_pain}
                onChange={e => set('joint_pain', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Проблемы с давлением?">
              <input
                style={inputStyle}
                type="text"
                value={form.pressure_issues}
                onChange={e => set('pressure_issues', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Операции / хирургические вмешательства?">
              <input
                style={inputStyle}
                type="text"
                value={form.surgeries}
                onChange={e => set('surgeries', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Врождённые / приобретённые патологии?">
              <input
                style={inputStyle}
                type="text"
                value={form.congenital_conditions}
                onChange={e => set('congenital_conditions', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Проблемы с ЖКТ?" hint="Гастрит, язва...">
              <input
                style={inputStyle}
                type="text"
                value={form.gi_issues}
                onChange={e => set('gi_issues', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Позвоночник: сколиоз, лордоз, кифоз, грыжа?">
              <input
                style={inputStyle}
                type="text"
                value={form.spine_conditions}
                onChange={e => set('spine_conditions', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Боли в грудной клетке?">
              <input
                style={inputStyle}
                type="text"
                value={form.chest_pain}
                onChange={e => set('chest_pain', e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <FieldGroup label="Витамины / БАДы / препараты">
              <input
                style={inputStyle}
                type="text"
                value={form.supplements}
                onChange={e => set('supplements', e.target.value)}
                placeholder="Не принимаю / перечислить..."
              />
            </FieldGroup>
            <FieldGroup label="Возраст (лет)">
              <input
                style={inputStyle}
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="25"
              />
            </FieldGroup>
            <FieldGroup label="Рост (см)">
              <input
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={form.height}
                onChange={e => set('height', e.target.value)}
                placeholder="175"
              />
            </FieldGroup>
            <FieldGroup label="Вес (кг)">
              <input
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="70"
              />
            </FieldGroup>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingBottom: 8 }}>
        {step > 1 && (
          <button
            onClick={back}
            style={{
              flex: 1,
              padding: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: 12,
              background: '#fff',
              color: '#555',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 50,
            }}
          >
            Назад
          </button>
        )}
        <button
          onClick={step === TOTAL_STEPS ? handleSubmit : next}
          disabled={submitting}
          style={{
            flex: 2,
            padding: '14px',
            border: 'none',
            borderRadius: 12,
            background: submitting ? '#aaa' : '#2481cc',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            minHeight: 50,
          }}
        >
          {submitting ? 'Сохранение...' : step === TOTAL_STEPS ? 'Сохранить' : 'Далее'}
        </button>
      </div>
    </Layout>
  );
}
