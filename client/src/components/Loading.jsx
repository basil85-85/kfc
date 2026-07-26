import React from 'react';

const Loading = ({ message = 'Loading KFC portal...', size = 96 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center select-none">
      {/* Football Bouncing & Spinning Container */}
      <div className="relative flex flex-col items-center justify-center" style={{ width: `${size}px`, height: `${size + 40}px` }}>
        
        {/* Animated Football Sphere */}
        <div 
          className="relative z-10"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            animation: 'football-bounce 0.85s ease-in-out infinite alternate'
          }}
        >
          {/* Continuous Rotating Ball Inner SVG */}
          <div
            className="w-full h-full"
            style={{
              animation: 'football-spin 2s linear infinite'
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-md"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Ball Outer Border & Base White Fill */}
              <circle cx="50" cy="50" r="48" fill="#F8FAFC" stroke="#0F172A" strokeWidth="3" />

              {/* 3D Curved Surface Shading Layer (Flat Color Overlay) */}
              <path
                d="M 50 2 A 48 48 0 0 1 98 50 A 48 48 0 0 1 50 98 A 48 48 0 0 0 50 2 Z"
                fill="#CBD5E1"
                opacity="0.25"
              />

              {/* Classic Pentagon Pattern (Center Pentagon) */}
              <polygon
                points="50,37 62,45 57,59 43,59 38,45"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />

              {/* Top Pentagon & Connecting Seam Lines */}
              <polygon
                points="50,6 61,15 57,28 43,28 39,15"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line x1="50" y1="37" x2="50" y2="28" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

              {/* Top-Right Pentagon & Seams */}
              <polygon
                points="84,28 92,40 82,51 70,45 72,32"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line x1="62" y1="45" x2="70" y2="45" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

              {/* Bottom-Right Pentagon & Seams */}
              <polygon
                points="75,76 77,90 64,95 54,85 61,72"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line x1="57" y1="59" x2="61" y2="72" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

              {/* Bottom-Left Pentagon & Seams */}
              <polygon
                points="25,76 39,72 46,85 36,95 23,90"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line x1="43" y1="59" x2="39" y2="72" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

              {/* Top-Left Pentagon & Seams */}
              <polygon
                points="16,28 28,32 30,45 18,51 8,40"
                fill="#0F172A"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line x1="38" y1="45" x2="30" y2="45" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

              {/* Hexagon Seam Intersections to Rim */}
              <line x1="39" y1="15" x2="28" y2="32" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              <line x1="61" y1="15" x2="72" y2="32" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="51" x2="75" y2="76" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="51" x2="25" y2="76" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Dynamic Soft Drop Shadow Beneath Ball */}
        <div
          className="absolute bottom-2 z-0 rounded-full bg-slate-950/60 blur-[3px]"
          style={{
            width: `${size * 0.7}px`,
            height: `${size * 0.16}px`,
            animation: 'shadow-scale 0.85s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Loading Message */}
      {message && (
        <p className="mt-4 font-space text-xs font-bold uppercase tracking-widest text-emerald-400 animate-pulse">
          {message}
        </p>
      )}

      {/* Embedded Animation Style Rules */}
      <style>{`
        @keyframes football-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes football-bounce {
          0% { transform: translateY(0px) scaleY(0.96) scaleX(1.04); }
          25% { transform: translateY(-2px) scale(1); }
          100% { transform: translateY(-28px) scale(1); }
        }

        @keyframes shadow-scale {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(0.45); opacity: 0.15; }
        }

        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
