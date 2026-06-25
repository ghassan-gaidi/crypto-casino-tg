import React from 'react';

interface PayoutBadgeProps {
  multiplier: number;
}

const PayoutBadge: React.FC<PayoutBadgeProps> = ({ multiplier }) => {
  const getColor = (m: number): { color: string; bg: string; shadow?: string } => {
    if (m >= 50) return { color: '#ff4444', bg: 'rgba(255, 68, 68, 0.15)', shadow: '0 0 8px rgba(255, 68, 68, 0.4)' };
    if (m >= 10) return { color: '#d4a017', bg: 'rgba(212, 160, 23, 0.15)', shadow: '0 0 6px rgba(212, 160, 23, 0.3)' };
    if (m >= 5) return { color: '#00e676', bg: 'rgba(0, 230, 118, 0.12)' };
    if (m >= 2) return { color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.12)' };
    return { color: '#666', bg: 'rgba(102, 102, 102, 0.1)' };
  };

  const { color, bg, shadow } = getColor(multiplier);

  const display = multiplier % 1 === 0 ? `${multiplier}x` : `${multiplier.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}x`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color,
        background: bg,
        border: `1px solid ${color}33`,
        marginLeft: '8px',
        verticalAlign: 'middle',
        textTransform: 'uppercase',
        ...(shadow ? { boxShadow: shadow } : {}),
      }}
    >
      {display}
    </span>
  );
};

export default PayoutBadge;
