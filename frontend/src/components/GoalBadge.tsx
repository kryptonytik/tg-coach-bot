import type { Goal } from '../types';

interface GoalBadgeProps {
  goal: Goal;
}

const GOAL_CONFIG: Record<Goal, { label: string; color: string; bg: string }> = {
  weight_gain: { label: 'Набор', color: '#1a73e8', bg: '#e8f0fe' },
  weight_loss: { label: 'Похудение', color: '#1e8e3e', bg: '#e6f4ea' },
  recovery: { label: 'Восстановление', color: '#e37400', bg: '#fef7e0' },
  maintenance: { label: 'Поддержание', color: '#5f6368', bg: '#f1f3f4' },
};

export default function GoalBadge({ goal }: GoalBadgeProps) {
  const config = GOAL_CONFIG[goal] || GOAL_CONFIG.maintenance;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
