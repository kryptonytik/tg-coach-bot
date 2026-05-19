interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  subtitle?: string;
  subtitleColor?: string;
}

export default function StatCard({ label, value, icon, color = '#2481cc', subtitle, subtitleColor }: StatCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      )}
      <span style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: '#666', lineHeight: 1.3 }}>{label}</span>
      {subtitle && <span style={{ fontSize: 11, color: subtitleColor ?? '#aaa', lineHeight: 1.3 }}>{subtitle}</span>}
    </div>
  );
}
