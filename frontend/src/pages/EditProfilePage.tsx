import { useEffect, useState } from 'react';
import { meApi } from '../api/client';
import Layout from '../components/Layout';
import type { CurrentUser, Goal } from '../types';

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'weight_gain', label: 'Набор массы' },
  { value: 'weight_loss', label: 'Похудение' },
  { value: 'recovery', label: 'Восстановление' },
  { value: 'maintenance', label: 'Поддержание' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
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
  marginBottom: 4,
  display: 'block',
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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
        <span
          style={{
            fontSize: 18,
            color: '#aaa',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface Props {
  currentUser: CurrentUser;
  onSaved?: () => void;
}

export default function EditProfilePage({ currentUser, onSaved }: Props) {
  // Main fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [targetWeight, setTargetWeight] = useState('');

  // Questionnaire fields
  const [hadTrainingBefore, setHadTrainingBefore] = useState<boolean | null>(null);
  const [previousSports, setPreviousSports] = useState('');
  const [timeSinceLastWorkout, setTimeSinceLastWorkout] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState(5);
  const [jointPain, setJointPain] = useState('');
  const [pressureIssues, setPressureIssues] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [congenitalConditions, setCongenitalConditions] = useState('');
  const [giIssues, setGiIssues] = useState('');
  const [spineConditions, setSpineConditions] = useState('');
  const [chestPain, setChestPain] = useState('');
  const [supplements, setSupplements] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [physicalLimitations, setPhysicalLimitations] = useState('');

  const [saving, setSaving] = useState(false);
  const [savingQuestionnaire, setSavingQuestionnaire] = useState(false);
  const [successMain, setSuccessMain] = useState(false);
  const [successQ, setSuccessQ] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorQ, setErrorQ] = useState<string | null>(null);

  useEffect(() => {
    meApi.getMe().then(user => {
      const c = user.client;
      if (!c) return;
      setFirstName(c.first_name || '');
      setLastName(c.last_name || '');
      setPhone(c.phone || '');
      setGoal(c.goal || 'maintenance');
      setTargetWeight(c.target_weight != null ? String(c.target_weight) : '');
      const q = c.questionnaire;
      if (q) {
        setHadTrainingBefore(q.had_training_before ?? null);
        setPreviousSports(q.previous_sports || '');
        setTimeSinceLastWorkout(q.time_since_last_workout || '');
        setFitnessLevel(q.fitness_level ?? 5);
        setJointPain(q.joint_pain || '');
        setPressureIssues(q.pressure_issues || '');
        setSurgeries(q.surgeries || '');
        setCongenitalConditions(q.congenital_conditions || '');
        setGiIssues(q.gi_issues || '');
        setSpineConditions(q.spine_conditions || '');
        setChestPain(q.chest_pain || '');
        setSupplements(q.supplements || '');
        setAge(q.age != null ? String(q.age) : '');
        setHeight(q.height != null ? String(q.height) : '');
        setWeight(q.weight != null ? String(q.weight) : '');
        setPhysicalLimitations(q.physical_limitations || '');
      }
    }).catch(() => {});
  }, []);

  const handleSaveMain = async () => {
    if (!firstName.trim()) { setError('Введите имя'); return; }
    setSaving(true);
    setError(null);
    setSuccessMain(false);
    try {
      await meApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        goal,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      });
      setSuccessMain(true);
      onSaved?.();
      setTimeout(() => setSuccessMain(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestionnaire = async () => {
    setSavingQuestionnaire(true);
    setErrorQ(null);
    setSuccessQ(false);
    try {
      await meApi.updateQuestionnaire({
        had_training_before: hadTrainingBefore,
        previous_sports: previousSports || null,
        time_since_last_workout: timeSinceLastWorkout || null,
        fitness_level: fitnessLevel,
        physical_limitations: physicalLimitations || null,
        joint_pain: jointPain || null,
        pressure_issues: pressureIssues || null,
        surgeries: surgeries || null,
        congenital_conditions: congenitalConditions || null,
        gi_issues: giIssues || null,
        spine_conditions: spineConditions || null,
        chest_pain: chestPain || null,
        supplements: supplements || null,
        age: age ? parseInt(age, 10) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      });
      setSuccessQ(true);
      onSaved?.();
      setTimeout(() => setSuccessQ(false), 3000);
    } catch (err: any) {
      setErrorQ(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSavingQuestionnaire(false);
    }
  };

  return (
    <Layout title="Мой профиль">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
        {/* Main section */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Основное</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <div style={{ padding: '10px 12px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13 }}>
                {error}
              </div>
            )}
            <FieldGroup label="Имя *">
              <input
                style={inputStyle}
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Александр"
              />
            </FieldGroup>
            <FieldGroup label="Фамилия">
              <input
                style={inputStyle}
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Иванов"
              />
            </FieldGroup>
            <FieldGroup label="Телефон">
              <input
                style={inputStyle}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 900 000 0000"
              />
            </FieldGroup>
            <FieldGroup label="Цель">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    style={{
                      padding: '10px 8px',
                      border: `2px solid ${goal === opt.value ? '#1e8e3e' : '#e0e0e0'}`,
                      borderRadius: 10,
                      background: goal === opt.value ? '#e6f4ea' : '#fff',
                      color: goal === opt.value ? '#1e8e3e' : '#555',
                      fontSize: 13,
                      fontWeight: goal === opt.value ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup label="Целевой вес (кг)">
              <input
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                placeholder="70"
              />
            </FieldGroup>
            <button
              onClick={handleSaveMain}
              disabled={saving}
              style={{
                padding: '12px',
                border: 'none',
                borderRadius: 10,
                background: saving ? '#aaa' : '#1e8e3e',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Сохранение...' : successMain ? 'Сохранено ✓' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Questionnaire accordion */}
        <AccordionSection title="Анкета">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {errorQ && (
              <div style={{ padding: '10px 12px', background: '#fce8e6', borderRadius: 8, color: '#c62828', fontSize: 13 }}>
                {errorQ}
              </div>
            )}
            <FieldGroup label="Занимались спортом раньше?">
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, l: 'Да' }, { v: false, l: 'Нет' }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    onClick={() => setHadTrainingBefore(v)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${hadTrainingBefore === v ? '#1e8e3e' : '#e0e0e0'}`,
                      borderRadius: 10,
                      background: hadTrainingBefore === v ? '#e6f4ea' : '#fff',
                      color: hadTrainingBefore === v ? '#1e8e3e' : '#555',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup label="Чем занимались?">
              <input
                style={inputStyle}
                type="text"
                value={previousSports}
                onChange={e => setPreviousSports(e.target.value)}
                placeholder="Футбол, плавание..."
              />
            </FieldGroup>
            <FieldGroup label="С последней тренировки">
              <input
                style={inputStyle}
                type="text"
                value={timeSinceLastWorkout}
                onChange={e => setTimeSinceLastWorkout(e.target.value)}
                placeholder="1 год, 3 месяца..."
              />
            </FieldGroup>
            <FieldGroup label={`Физическая подготовка: ${fitnessLevel} / 10`}>
              <input
                type="range"
                min={1}
                max={10}
                value={fitnessLevel}
                onChange={e => setFitnessLevel(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1e8e3e' }}
              />
            </FieldGroup>
            <FieldGroup label="Ограничения по физической нагрузке">
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                value={physicalLimitations}
                onChange={e => setPhysicalLimitations(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Боли в суставах (колени/локти)?">
              <input
                style={inputStyle}
                type="text"
                value={jointPain}
                onChange={e => setJointPain(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Проблемы с давлением?">
              <input
                style={inputStyle}
                type="text"
                value={pressureIssues}
                onChange={e => setPressureIssues(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Операции?">
              <input
                style={inputStyle}
                type="text"
                value={surgeries}
                onChange={e => setSurgeries(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Врождённые / приобретённые патологии?">
              <input
                style={inputStyle}
                type="text"
                value={congenitalConditions}
                onChange={e => setCongenitalConditions(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Проблемы с ЖКТ?">
              <input
                style={inputStyle}
                type="text"
                value={giIssues}
                onChange={e => setGiIssues(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Позвоночник?">
              <input
                style={inputStyle}
                type="text"
                value={spineConditions}
                onChange={e => setSpineConditions(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Боли в грудной клетке?">
              <input
                style={inputStyle}
                type="text"
                value={chestPain}
                onChange={e => setChestPain(e.target.value)}
                placeholder="Нет / описать..."
              />
            </FieldGroup>
            <FieldGroup label="Витамины / БАДы / препараты">
              <input
                style={inputStyle}
                type="text"
                value={supplements}
                onChange={e => setSupplements(e.target.value)}
                placeholder="Не принимаю / перечислить..."
              />
            </FieldGroup>
            <FieldGroup label="Возраст (лет)">
              <input
                style={inputStyle}
                type="number"
                inputMode="numeric"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="25"
              />
            </FieldGroup>
            <FieldGroup label="Рост (см)">
              <input
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="175"
              />
            </FieldGroup>
            <FieldGroup label="Вес (кг)">
              <input
                style={inputStyle}
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="70"
              />
            </FieldGroup>
            <button
              onClick={handleSaveQuestionnaire}
              disabled={savingQuestionnaire}
              style={{
                padding: '12px',
                border: 'none',
                borderRadius: 10,
                background: savingQuestionnaire ? '#aaa' : '#2481cc',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: savingQuestionnaire ? 'not-allowed' : 'pointer',
              }}
            >
              {savingQuestionnaire ? 'Сохранение...' : successQ ? 'Сохранено ✓' : 'Сохранить анкету'}
            </button>
          </div>
        </AccordionSection>
      </div>
    </Layout>
  );
}
