import React from 'react';

interface TanwirGraphicPatternProps {
  className?: string;
  height?: number;
  variant?: 'banner' | 'ribbon' | 'frieze' | 'card-accent';
}

/**
 * Komponen Elemen Grafis Resmi Tanwir & Milad ke-114 Muhammadiyah.
 * Motif daun semanggi / trefoil bertangkai dengan gradasi hijau-lime
 * di atas latar biru dongker (Navy Blue) khas Muhammadiyah.
 */
export const TanwirGraphicPattern: React.FC<TanwirGraphicPatternProps> = ({
  className = '',
  height = 36,
  variant = 'ribbon',
}) => {
  if (variant === 'card-accent') {
    return (
      <div className={`h-2.5 w-full overflow-hidden bg-[#182a69] ${className}`}>
        <svg
          viewBox="0 0 1200 40"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tanwirGreenGradCard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>
            <linearGradient id="tanwirLimeGradCard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>
          </defs>
          <rect width="1200" height="40" fill="#182a69" />
          {Array.from({ length: 24 }).map((_, i) => {
            const x = i * 50 + 25;
            return (
              <g key={i}>
                <line x1={x} y1="0" x2={x} y2="40" stroke="#84cc16" strokeWidth="2.5" />
                <circle cx={x} cy="10" r="7" fill="url(#tanwirGreenGradCard)" />
                <circle cx={x - 6} cy="18" r="6" fill="url(#tanwirGreenGradCard)" />
                <circle cx={x + 6} cy="18" r="6" fill="url(#tanwirGreenGradCard)" />
                <circle cx={x} cy="30" r="7" fill="url(#tanwirLimeGradCard)" />
                <circle cx={x - 6} cy="32" r="5" fill="url(#tanwirLimeGradCard)" />
                <circle cx={x + 6} cy="32" r="5" fill="url(#tanwirLimeGradCard)" />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden bg-[#182a69] select-none ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients matching the Milad 114 Muhammadiyah graphic */}
          <linearGradient id="tanwirGreenTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38a169" />
            <stop offset="50%" stopColor="#2f855a" />
            <stop offset="100%" stopColor="#22543d" />
          </linearGradient>

          <linearGradient id="tanwirGreenMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>

          <linearGradient id="tanwirLimeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="60%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>

          <linearGradient id="tanwirStem" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>

          {/* Trefoil / 3-lobe leaf cluster symbol */}
          <g id="trefoilCluster">
            {/* Center stem */}
            <line x1="0" y1="-28" x2="0" y2="28" stroke="url(#tanwirStem)" strokeWidth="3" strokeLinecap="round" />
            {/* Top lobe */}
            <circle cx="0" cy="-14" r="11" fill="url(#tanwirGreenMid)" />
            {/* Left lobe */}
            <circle cx="-11" cy="0" r="11" fill="url(#tanwirGreenMid)" />
            {/* Right lobe */}
            <circle cx="11" cy="0" r="11" fill="url(#tanwirGreenMid)" />
            {/* Center connector bud */}
            <circle cx="0" cy="14" r="11" fill="url(#tanwirLimeBottom)" />
          </g>
        </defs>

        {/* Navy Blue Base Background */}
        <rect width="1440" height="120" fill="#182a69" />

        {/* Subtle accent horizontal lines */}
        <line x1="0" y1="2" x2="1440" y2="2" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
        <line x1="0" y1="118" x2="1440" y2="118" stroke="#84cc16" strokeWidth="2" opacity="0.6" />

        {/* Row of Trefoil Leaves Pattern identical to the graphic */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = i * 76 + 38;
          return (
            <g key={i} transform={`translate(${x}, 58)`}>
              {/* Upper stem & lobes */}
              <line x1="0" y1="-50" x2="0" y2="50" stroke="#84cc16" strokeWidth="3.5" />
              {/* Top flower / trefoil */}
              <circle cx="0" cy="-38" r="12" fill="url(#tanwirLimeBottom)" />
              <circle cx="-13" cy="-26" r="12" fill="url(#tanwirGreenMid)" />
              <circle cx="13" cy="-26" r="12" fill="url(#tanwirGreenMid)" />

              {/* Middle mirrored trefoil */}
              <circle cx="-13" cy="8" r="13" fill="url(#tanwirGreenMid)" />
              <circle cx="13" cy="8" r="13" fill="url(#tanwirGreenMid)" />
              <circle cx="0" cy="22" r="13" fill="url(#tanwirLimeBottom)" />

              {/* Bottom lobes */}
              <circle cx="-13" cy="46" r="11" fill="url(#tanwirLimeBottom)" />
              <circle cx="13" cy="46" r="11" fill="url(#tanwirLimeBottom)" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
