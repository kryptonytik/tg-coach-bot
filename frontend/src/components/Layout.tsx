import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function Layout({ children, title, showBack, rightAction }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--tg-theme-bg-color, #f0f2f5)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {(title || showBack || !isRoot) && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'var(--tg-theme-bg-color, #ffffff)',
            borderBottom: '1px solid #e8e8e8',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 52,
          }}
        >
          {(showBack || !isRoot) && (
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px 4px 0',
                fontSize: 22,
                color: 'var(--tg-theme-button-color, #2481cc)',
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Назад"
            >
              ‹
            </button>
          )}
          {title && (
            <h1
              style={{
                flex: 1,
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--tg-theme-text-color, #000)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h1>
          )}
          {rightAction && <div style={{ marginLeft: 'auto' }}>{rightAction}</div>}
        </header>
      )}
      <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
