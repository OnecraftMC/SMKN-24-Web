'use client';

import React, { useState, useEffect } from 'react';

interface LogoLoadingAnimationProps {
  onFinished?: () => void;
  className?: string;
  showReplayButton?: boolean;
}

export default function LogoLoadingAnimation({
  onFinished,
  className = 'w-[340px] max-w-[85vw]',
  showReplayButton = false,
}: LogoLoadingAnimationProps) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 3200);
    return () => clearTimeout(timer);
  }, [animKey, onFinished]);

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <style jsx global>{`
        @keyframes shieldIntro {
          0% { opacity: 0; transform: scale(0.82); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ovalIntro {
          0% { opacity: 0; transform: scale(0.65); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes waveSlide {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveIdle {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-3.5px) scaleY(1.06); }
        }
        @keyframes emblemIntro {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { opacity: 1; transform: scale(1.08) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wheatLeftIntro {
          0% { opacity: 0; transform: translateX(-35px) rotate(-14deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0); }
        }
        @keyframes wheatRightIntro {
          0% { opacity: 0; transform: translateX(35px) rotate(14deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0); }
        }
        @keyframes num24Pop {
          0% { opacity: 0; transform: scale(0.2); }
          65% { opacity: 1; transform: scale(1.22); }
          85% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes smknFade {
          0% { opacity: 0; transform: translateY(-8px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropletIntro {
          0% { opacity: 0; transform: scale(0) translateY(12px); }
          70% { opacity: 1; transform: scale(1.3) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes flameGlow {
          0%, 100% { filter: drop-shadow(0 0 2px #ffbb00) drop-shadow(0 0 6px #ff7700); }
          50% { filter: drop-shadow(0 0 5px #ffe600) drop-shadow(0 0 12px #ff5500); }
        }
        @keyframes curvedTextIntro {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ribbonIntro {
          0% { opacity: 0; transform: scaleX(0.2) scaleY(0.5) translateY(10px); }
          70% { opacity: 1; transform: scaleX(1.08) scaleY(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes jakartaIntro {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div key={animKey} className={`relative aspect-[340/380] select-none ${className}`}>
        <svg
          viewBox="0 0 340 380"
          className="w-full h-full overflow-visible drop-shadow-[0_15px_30px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <clipPath id="ovalClip">
              <ellipse cx="170" cy="180" rx="58" ry="86" />
            </clipPath>
            <path id="curvedPathSMK" d="M 72,236 A 102,118 0 1,1 268,236" fill="none" />
          </defs>

          <g style={{ transformOrigin: '170px 180px', animation: 'shieldIntro 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <path d="M 170,26 L 310,126 L 272,308 C 235,322 105,322 68,308 L 30,126 Z" fill="#FFE600" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
          </g>

          <g style={{ transformOrigin: '170px 180px', animation: 'ovalIntro 0.42s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards', opacity: 0 }}>
            <ellipse cx="170" cy="180" rx="58" ry="86" fill="#0852cf" stroke="#000000" strokeWidth="3.5" />
          </g>

          <g clipPath="url(#ovalClip)">
            <g style={{ transformOrigin: '170px 230px', animation: 'waveSlide 0.4s ease-out 0.6s forwards, waveIdle 3.2s ease-in-out 1.0s infinite', opacity: 0 }}>
              <path d="M 90,226 Q 130,214 170,226 T 250,226 L 250,270 L 90,270 Z" fill="#003c9d" stroke="#000000" strokeWidth="2" />
              <path d="M 90,236 Q 130,224 170,236 T 250,236" fill="none" stroke="#ffffff" strokeWidth="2" />
              <path d="M 90,246 Q 130,234 170,246 T 250,246 L 250,270 L 90,270 Z" fill="#052e75" stroke="#000000" strokeWidth="1.5" />
              <path d="M 90,254 Q 130,244 170,254 T 250,254" fill="none" stroke="#ffffff" strokeWidth="2" />
            </g>
          </g>

          <g style={{ transformOrigin: '170px 190px', animation: 'emblemIntro 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards', opacity: 0 }}>
            <path d="M 164,118 L 176,118 L 174,212 L 166,212 Z" fill="#000000" />
            <rect x="146" y="204" width="48" height="8" rx="1.5" fill="#000000" />
            <path d="M 152,212 L 188,212 L 180,236 L 160,236 Z" fill="#000000" />
            <path d="M 160,236 L 180,236 L 177,256 L 170,274 L 163,256 Z" fill="#ffffff" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
            <line x1="170" y1="242" x2="170" y2="268" stroke="#000000" strokeWidth="2" />
            <circle cx="170" cy="242" r="2" fill="#000000" />
          </g>

          <g style={{ transformOrigin: '140px 200px', animation: 'wheatLeftIntro 0.42s ease-out 1.0s forwards', opacity: 0 }}>
            <path d="M 134,232 C 122,216 122,180 144,152" fill="none" stroke="#000000" strokeWidth="2" />
            {[
              { cx: 138, cy: 154, rx: 4, ry: 2.2, rot: -30 },
              { cx: 133, cy: 164, rx: 4.5, ry: 2.5, rot: -40 },
              { cx: 129, cy: 176, rx: 4.5, ry: 2.5, rot: -50 },
              { cx: 127, cy: 189, rx: 4.5, ry: 2.5, rot: -60 },
              { cx: 127, cy: 202, rx: 4.5, ry: 2.5, rot: -70 },
              { cx: 130, cy: 215, rx: 4.5, ry: 2.5, rot: -80 },
              { cx: 135, cy: 226, rx: 4.2, ry: 2.5, rot: -90 },
            ].map((p, i) => (
              <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} transform={`rotate(${p.rot}, ${p.cx}, ${p.cy})`} fill="#ffdd00" stroke="#000000" strokeWidth="1.2" />
            ))}
          </g>

          <g style={{ transformOrigin: '200px 200px', animation: 'wheatRightIntro 0.42s ease-out 1.0s forwards', opacity: 0 }}>
            <path d="M 206,232 C 218,216 218,180 196,152" fill="none" stroke="#000000" strokeWidth="2" />
            {[
              { cx: 202, cy: 154, r: 3.2 },
              { cx: 207, cy: 164, r: 3.5 },
              { cx: 211, cy: 176, r: 3.8 },
              { cx: 213, cy: 189, r: 3.8 },
              { cx: 213, cy: 202, r: 3.8 },
              { cx: 210, cy: 215, r: 3.6 },
              { cx: 205, cy: 226, r: 3.4 },
            ].map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#ffffff" stroke="#000000" strokeWidth="1.4" />
            ))}
          </g>

          <g style={{ transformOrigin: '170px 198px', animation: 'num24Pop 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1.2s forwards', opacity: 0 }}>
            <text x="170" y="206" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="45" fontWeight="900" fontStyle="italic" letterSpacing="-1.5" fill="#ffffff" stroke="#000000" strokeWidth="8" strokeLinejoin="round">24</text>
            <text x="170" y="206" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="45" fontWeight="900" fontStyle="italic" letterSpacing="-1.5" fill="#ff8400" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round">24</text>
          </g>

          <g style={{ transformOrigin: '170px 148px', animation: 'smknFade 0.35s ease-out 1.3s forwards', opacity: 0 }}>
            <text x="170" y="148" textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontSize="16" fontWeight="900" fill="#000000" stroke="#000000" strokeWidth="4" strokeLinejoin="round">SMKN</text>
            <text x="170" y="148" textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontSize="16" fontWeight="900" fill="#ffffff">SMKN</text>
          </g>

          <g style={{ transformOrigin: '170px 108px', animation: 'dropletIntro 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1.6s forwards', opacity: 0 }}>
            <g style={{ animation: 'flameGlow 2.5s ease-in-out 1.9s infinite' }}>
              <path d="M 170,92 C 177,105 178,114 170,119 C 162,114 163,105 170,92 Z" fill="#ff9900" stroke="#000000" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M 170,98 C 174,107 175,113 170,116 C 165,113 166,107 170,98 Z" fill="#ffe600" />
            </g>
          </g>

          <g style={{ transformOrigin: '170px 180px', animation: 'curvedTextIntro 0.5s ease-out 1.8s forwards', opacity: 0 }}>
            <text fontFamily="'Arial Black', 'Impact', sans-serif" fontSize="15" fontWeight="900" fill="#000000">
              <textPath href="#curvedPathSMK" startOffset="50%" textAnchor="middle">SEKOLAH MENENGAH KEJURUAN</textPath>
            </text>
          </g>

          <g style={{ transformOrigin: '170px 330px', animation: 'ribbonIntro 0.5s cubic-bezier(0.16, 1, 0.3, 1) 2.2s forwards', opacity: 0 }}>
            <path d="M 40,326 L 76,310 L 80,336 L 44,354 Z" fill="#d96b00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 44,354 L 62,339 L 40,326 Z" fill="#b35400" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 300,326 L 264,310 L 260,336 L 296,354 Z" fill="#d96b00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 296,354 L 278,339 L 300,326 Z" fill="#b35400" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 68,324 Q 170,352 272,324 L 264,354 Q 170,380 76,354 Z" fill="#f58220" stroke="#000000" strokeWidth="3.5" strokeLinejoin="round" />
          </g>

          <g style={{ transformOrigin: '170px 352px', animation: 'jakartaIntro 0.4s ease-out 2.6s forwards', opacity: 0 }}>
            <text x="170" y="354" textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontSize="17" fontWeight="900" letterSpacing="3" fill="#000000">JAKARTA</text>
          </g>
        </svg>
      </div>
      {showReplayButton && (
        <button onClick={handleReplay} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Replay</button>
      )}
    </div>
  );
}