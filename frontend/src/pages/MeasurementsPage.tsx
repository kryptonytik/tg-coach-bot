import { useEffect, useState } from 'react';
import { meApi } from '../api/client';
import Layout from '../components/Layout';
import type { BodyMeasurement, CurrentUser } from '../types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface MeasurementForm {
  date: string;
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  arm: string;
  thigh: string;
  notes: string;
}

const emptyForm = (): MeasurementForm => ({
  date: todayISO(),
  weight: '',
  chest: '',
  waist: '',
  hips: '',
  arm: '',
  thigh: '',
  notes: '',
});

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

interface MeasurementChipProps {
  label: string;
  value: string;
}

function MeasurementChip({ label, value }: MeasurementChipProps) {
  return (
    <span
      style={{
        background: '#f0f7ff',
        color: '#2481cc',
        borderRadius: 8,
        padding: '4px 10px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}: {value}
    </span>
  );
}

interface MeasurementsPageProps {
  currentUser?: CurrentUser;
}

export default function MeasurementsPage({ currentUser }: MeasurementsPageProps = {}) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MeasurementForm>(emptyForm());
  const [weightPreFilled, setWeightPreFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeasurements = () => {
    setLoading(true);
    meApi
      .getMeasurements()
      .then(data => {
        setMeasurements(data);
        // Collapse form by default if there are existing measurements
        if (data.length > 0) {
          setFormOpen(false);
        } else {
          setFormOpen(true);
          // Pre-fill weight from questionnaire if no measurements yet
          const qWeight = currentUser?.client?.questionnaire?.weight;
          if (qWeight != null) {
            setForm(f => ({ ...f, weight: String(qWeight) }));
            setWeightPreFilled(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeasurements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof MeasurementForm, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const hasAnyField =
    form.weight.trim() ||
    form.chest.trim() ||
    form.waist.trim() ||
    form.hips.trim() ||
    form.arm.trim() ||
    form.thigh.trim() ||
    form.notes.trim();

  const handleSave = async () => {
    if (!hasAnyField) return;
    setSaving(true);
    setError(null);
    try {
      await meApi.addMeasurement({
        date: form.date,
        weight: form.weight ? parseFloat(form.weight) : null,
        chest: form.chest ? parseFloat(form.chest) : null,
        waist: form.waist ? parseFloat(form.waist) : null,
        hips: form.hips ? parseFloat(form.hips) : null,
        arm: form.arm ? parseFloat(form.arm) : null,
        thigh: form.thigh ? parseFloat(form.thigh) : null,
        notes: form.notes.trim() || null,
      });
      setForm(emptyForm());
      setFormOpen(false);
      fetchMeasurements();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Вес и замеры">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
        {/* Add measurement section */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Collapsible header */}
          <button
            onClick={() => setFormOpen(v => !v)}
            style={{
              width: '100%',
              padding: '16px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 15,
              fontWeight: 700,
              color: '#000',
            }}
          >
            <span>📝 Новые замеры</span>
            <span
              style={{
                fontSize: 18,
                transform: formOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
                color: '#888',
              }}
            >
              ▾
            </span>
          </button>

          {formOpen && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fce8e6',
                    borderRadius: 8,
                    color: '#c62828',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <FieldGroup label="Дата">
                <input
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', minWidth: 0, flex: 1 }}
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label="Вес (кг)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={e => { set('weight', e.target.value); setWeightPreFilled(false); }}
                    placeholder="88.5"
                  />
                  {weightPreFilled && (
                    <span style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Из анкеты</span>
                  )}
                </FieldGroup>
                <FieldGroup label="Грудь (см)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.chest}
                    onChange={e => set('chest', e.target.value)}
                    placeholder="100"
                  />
                </FieldGroup>
                <FieldGroup label="Талия (см)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.waist}
                    onChange={e => set('waist', e.target.value)}
                    placeholder="80"
                  />
                </FieldGroup>
                <FieldGroup label="Бёдра (см)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.hips}
                    onChange={e => set('hips', e.target.value)}
                    placeholder="100"
                  />
                </FieldGroup>
                <FieldGroup label="Рука — бицепс (см)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.arm}
                    onChange={e => set('arm', e.target.value)}
                    placeholder="38"
                  />
                </FieldGroup>
                <FieldGroup label="Бедро (см)">
                  <input
                    style={inputStyle}
                    type="number"
                    inputMode="decimal"
                    value={form.thigh}
                    onChange={e => set('thigh', e.target.value)}
                    placeholder="58"
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Заметки">
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Самочувствие, особые условия..."
                />
              </FieldGroup>

              <button
                onClick={handleSave}
                disabled={saving || !hasAnyField}
                style={{
                  padding: '14px',
                  border: 'none',
                  borderRadius: 12,
                  background: saving || !hasAnyField ? '#aaa' : '#1e8e3e',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving || !hasAnyField ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить замеры'}
              </button>
              {!hasAnyField && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: -8 }}>
                  Заполните хотя бы одно поле
                </div>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#555' }}>
            История замеров
          </h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{ background: '#e8e8e8', borderRadius: 12, height: 80 }}
                />
              ))}
            </div>
          ) : measurements.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#888',
                padding: '30px 0',
                fontSize: 15,
              }}
            >
              Нет записей. Добавьте первые замеры!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {measurements.slice(0, 20).map(m => {
                const chips: { label: string; value: string }[] = [];
                if (m.weight != null) chips.push({ label: 'Вес', value: `${m.weight} кг` });
                if (m.chest != null) chips.push({ label: 'Грудь', value: `${m.chest} см` });
                if (m.waist != null) chips.push({ label: 'Талия', value: `${m.waist} см` });
                if (m.hips != null) chips.push({ label: 'Бёдра', value: `${m.hips} см` });
                if (m.arm != null) chips.push({ label: 'Рука', value: `${m.arm} см` });
                if (m.thigh != null) chips.push({ label: 'Бедро', value: `${m.thigh} см` });

                return (
                  <div
                    key={m.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#444',
                        marginBottom: 8,
                      }}
                    >
                      {formatDate(m.date)}
                    </div>
                    {chips.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: m.notes ? 8 : 0 }}>
                        {chips.map(c => (
                          <MeasurementChip key={c.label} label={c.label} value={c.value} />
                        ))}
                      </div>
                    )}
                    {m.notes && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#666',
                          fontStyle: 'italic',
                          marginTop: 4,
                        }}
                      >
                        {m.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
