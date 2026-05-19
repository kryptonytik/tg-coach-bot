import { useState } from 'react';

interface ExerciseSetRowProps {
  setNumber: number;
  onSave: (weight: number | null, reps: number | null) => void;
  disabled?: boolean;
}

export default function ExerciseSetRow({ setNumber, onSave, disabled }: ExerciseSetRowProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const handleSave = () => {
    const w = weight !== '' ? parseFloat(weight) : null;
    const r = reps !== '' ? parseInt(reps, 10) : null;
    onSave(w, r);
    setWeight('');
    setReps('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#2481cc',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {setNumber}
      </span>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#888', display: 'block' }}>Вес (кг)</label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="0"
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 16,
              background: disabled ? '#f5f5f5' : '#fff',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#888', display: 'block' }}>Повторений</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="0"
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 16,
              background: disabled ? '#f5f5f5' : '#fff',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={disabled || (weight === '' && reps === '')}
        style={{
          padding: '8px 14px',
          background: '#2481cc',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: 44,
          opacity: disabled || (weight === '' && reps === '') ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  );
}
