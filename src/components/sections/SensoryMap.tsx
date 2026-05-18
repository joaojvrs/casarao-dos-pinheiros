import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'motion/react';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = { bg: '#F6F1E8', brown: '#2A1E17', gold: '#B08D57', goldLight: '#D4AA6A' } as const;

// Matching the Midjourney image dimensions (16:9 at 1456px)
const VW = 1456, VH = 816;

// ─── Landmark data ────────────────────────────────────────────────────────────
// x/y  = position of the landmark on the image (calibrate if needed)
// lx/ly = position of the floating label
// la    = text-anchor for the label name

const POINTS = [
  {
    id: '1', name: 'O Casarão',
    sub: 'Coração da fazenda.\nHistória, encontros\ne novas memórias.',
    x: 539,  y: 326,
    lx: 539,  ly: 195, la: 'middle' as const,
  },
  {
    id: '2', name: 'Cachoeira Alta',
    sub: 'Energia vital\ne renovação.',
    x: 1049, y: 147,
    lx: 1270, ly: 128, la: 'start' as const,
  },
  {
    id: '3', name: 'Cabana Norte',
    sub: 'Refúgio privado\nentre os pinheiros.',
    x: 262,  y: 377,
    lx: 88,   ly: 352, la: 'end' as const,
  },
  {
    id: '4', name: 'Mirante Tech',
    sub: 'Inspiração,\nvisão e altitude.',
    x: 1209, y: 563,
    lx: 1328, ly: 540, la: 'start' as const,
  },
  {
    id: '5', name: 'Jardins do Vale',
    sub: 'Beleza, contemplação\ne bem-estar.',
    x: 597,  y: 579,
    lx: 597,  ly: 688, la: 'middle' as const,
  },
] as const;

type Pt = typeof POINTS[number];

// ─── Trail paths (Casarão → each other location) ──────────────────────────────
const TRAILS = [
  'M 556,318 C 648,266 756,218 864,184 C 950,158 1010,150 1044,149',  // → Cachoeira
  'M 522,326 C 448,337 374,353 306,366 C 278,372 263,377 255,379',    // → Cabanas
  'M 541,340 C 544,400 550,466 558,532 C 564,554 574,572 593,579',    // → Jardins
  'M 558,334 C 678,398 842,456 984,512 C 1086,548 1160,560 1202,563', // → Mirante
];

// ─── SVG Icons (line art, 20×20 viewspace centered at 0,0) ────────────────────
const ICONS: Record<string, React.ReactNode> = {
  '1': ( // manor
    <g fill="none" stroke={C.gold} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-8,7 L-8,-1 L0,-8 L8,-1 L8,7 Z"/>
      <rect x="-3" y="1" width="6" height="6"/>
      <line x1="-5" y1="-1" x2="-5" y2="7"/>
      <line x1="5"  y1="-1" x2="5"  y2="7"/>
    </g>
  ),
  '2': ( // waterfall
    <g fill="none" stroke={C.gold} strokeWidth="1.1" strokeLinecap="round">
      <path d="M-6,-5 Q-3,-8 0,-5 Q3,-2 6,-5"/>
      <path d="M-6, 0 Q-3,-3 0, 0 Q3, 3 6, 0"/>
      <path d="M-6, 5 Q-3, 2 0, 5 Q3, 8 6, 5"/>
    </g>
  ),
  '3': ( // cabin
    <g fill="none" stroke={C.gold} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-7,7 L-7,-1 L0,-8 L7,-1 L7,7 Z"/>
      <rect x="-2.5" y="1" width="5" height="6"/>
    </g>
  ),
  '4': ( // viewpoint / mirante
    <g fill="none" stroke={C.gold} strokeWidth="1.1" strokeLinecap="round">
      <line x1="-7" y1="4" x2="7" y2="4"/>
      <line x1="-5" y1="4" x2="-5" y2="-2"/>
      <line x1="5"  y1="4" x2="5"  y2="-2"/>
      <line x1="-5" y1="-2" x2="5" y2="-2"/>
      <line x1="0"  y1="-2" x2="0" y2="-8"/>
      <path d="M-3,-7 L0,-10 L3,-7" strokeWidth="0.9"/>
    </g>
  ),
  '5': ( // garden / leaf
    <g fill="none" stroke={C.gold} strokeWidth="1.1" strokeLinecap="round">
      <path d="M0,8 Q-6,0 0,-8 Q6,0 0,8"/>
      <line x1="0" y1="-8" x2="0" y2="8"/>
      <line x1="-3.5" y1="0" x2="3.5" y2="0"/>
    </g>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Trail({ d, delay }: { d: string; delay: number }) {
  return (
    <motion.path d={d} fill="none" stroke={C.gold} strokeWidth={1.3}
      strokeLinecap="round" strokeDasharray="5,10"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.85 }}
      transition={{ duration: 3.2, delay, ease: [0.43, 0.13, 0.23, 0.96] }}
      viewport={{ once: true, margin: '-80px' }}
    />
  );
}

function Label({ pt, hot }: { pt: Pt; hot: boolean }) {
  const lines = pt.sub.split('\n');
  const lineH = 10.5;
  const blockH = lines.length * lineH;

  // Leader line end points — offset slightly from label and point
  const leaderY0 = pt.ly + 26 + blockH; // below the text block
  const leaderX0 = pt.lx;

  return (
    <g>
      {/* Leader line */}
      <line x1={leaderX0} y1={leaderY0} x2={pt.x} y2={pt.y}
        stroke={C.gold} strokeWidth={0.6} strokeDasharray="3,6" opacity={0.55} />

      {/* Label group */}
      <g transform={`translate(${pt.lx}, ${pt.ly})`}>
        {/* Icon */}
        <g transform="scale(1.05)">{ICONS[pt.id]}</g>

        {/* Name */}
        <text y={22} textAnchor={pt.la}
          fontFamily="'Playfair Display', serif" fontSize="11.5" fontStyle="italic"
          fill={C.brown} opacity={hot ? 1 : 0.88}
          style={{ transition: 'opacity 0.25s' }}
        >
          {pt.name}
        </text>

        {/* Subtitle lines */}
        {lines.map((line, i) => (
          <text key={i} y={22 + 14 + i * lineH} textAnchor={pt.la}
            fontFamily="Outfit, sans-serif" fontSize="7.8"
            fill={C.brown} opacity={hot ? 0.65 : 0.42}
            letterSpacing="0.04em"
            style={{ transition: 'opacity 0.25s' }}
          >
            {line}
          </text>
        ))}

        {/* Gold underline */}
        <motion.line
          x1={pt.la === 'end' ? -45 : pt.la === 'start' ? 0 : -22}
          y1={26}
          x2={pt.la === 'start' ? 45 : pt.la === 'end' ? 0 : 22}
          y2={26}
          stroke={C.gold} strokeWidth={0.65}
          animate={{ opacity: [0.3, 0.85, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const SensoryMap: React.FC = () => {
  const [active, setActive] = useState<Pt | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView  = useInView(wrapRef, { once: true, margin: '-80px' });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sx   = useSpring(rawX, { stiffness: 32, damping: 16 });
  const sy   = useSpring(rawY, { stiffness: 32, damping: 16 });
  const ox   = useTransform(sx, [-1, 1], [-7, 7]);
  const oy   = useTransform(sy, [-1, 1], [-7, 7]);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width)  * 2 - 1);
    rawY.set(((e.clientY - r.top)  / r.height) * 2 - 1);
  }, [rawX, rawY]);

  const onLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, [rawX, rawY]);

  return (
    <section className="relative py-32 overflow-hidden" style={{ background: C.bg }}>

      {/* Header */}
      <div className="container mx-auto px-6 text-center mb-16">
        <motion.span
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ color: C.gold }}
          className="uppercase tracking-[0.45em] text-[10px] font-bold mb-4 block"
        >
          Cartografia Imersiva
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }} viewport={{ once: true }}
          style={{ color: C.brown }}
          className="font-serif text-5xl md:text-7xl mb-8"
        >
          O Mapa <span className="italic font-light" style={{ opacity: 0.5 }}>da Fazenda.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          transition={{ delay: 0.34 }} viewport={{ once: true }}
          style={{ color: `${C.brown}90` }}
          className="max-w-2xl mx-auto text-lg leading-relaxed font-light"
        >
          Uma cartografia à mão — descubra os pontos vitais de energia e luxo
          no coração do Vale do Eden.
        </motion.p>
      </div>

      {/* Map */}
      <div className="w-full max-w-7xl mx-auto px-4">
        <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={onLeave}>

          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full h-auto block"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glowHot" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="vig" cx="50%" cy="50%" r="65%">
                <stop offset="0%"   stopColor="transparent"/>
                <stop offset="100%" stopColor="rgba(42,30,23,0.12)"/>
              </radialGradient>
            </defs>

            {/* ── Illustrated base image ── */}
            <image
              href="/mapa.jpg"
              x="0" y="0" width={VW} height={VH}
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Subtle contrast layer */}
            <rect width={VW} height={VH} fill="rgba(42,30,23,0.04)" pointerEvents="none"/>

            {/* ── Parallax overlay ── */}
            <motion.g style={{ x: ox, y: oy }}>

              {/* Animated trails */}
              {TRAILS.map((d, i) => (
                <Trail key={i} d={d} delay={0.6 + i * 0.28} />
              ))}

              {/* Landmarks */}
              {POINTS.map((pt, i) => {
                const hot = active?.id === pt.id;
                return (
                  <motion.g key={pt.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.8 + i * 0.18, duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    {/* Label + leader */}
                    <Label pt={pt} hot={hot} />

                    {/* Outer breathing halo */}
                    <motion.g
                      style={{ originX: `${pt.x}px`, originY: `${pt.y}px` }}
                      animate={{ scale: [0.7, 1.3, 0.7], opacity: [0.18, 0.04, 0.18] }}
                      transition={{ duration: 4.2, delay: i * 0.72, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <circle cx={pt.x} cy={pt.y} r={20} fill={C.gold} />
                    </motion.g>
                    {/* Ring */}
                    <motion.g
                      animate={{ opacity: [0.7, 0.18, 0.7] }}
                      transition={{ duration: 4.2, delay: i * 0.72 + 0.6, repeat: Infinity }}
                    >
                      <circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke={C.gold} strokeWidth={0.85} />
                    </motion.g>
                    {/* Core dot — hover target */}
                    <circle cx={pt.x} cy={pt.y} r={5.5}
                      fill={hot ? C.gold : C.bg}
                      stroke={C.gold} strokeWidth={1.4}
                      filter={hot ? 'url(#glowHot)' : 'url(#glow)'}
                      style={{ cursor: 'crosshair', transition: 'fill 0.22s' }}
                      onMouseEnter={() => setActive(pt)}
                      onMouseLeave={() => setActive(null)}
                    />
                  </motion.g>
                );
              })}

              {/* Compass rose — top-left cream margin */}
              {inView && (
                <motion.g transform="translate(68, 68)"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 3, duration: 1 }}
                >
                  <line x1="0" y1="-28" x2="0" y2="28"    stroke={C.brown} strokeWidth="0.8" opacity="0.4"/>
                  <line x1="-28" y1="0" x2="28" y2="0"    stroke={C.brown} strokeWidth="0.8" opacity="0.4"/>
                  <line x1="-20" y1="-20" x2="20" y2="20" stroke={C.brown} strokeWidth="0.4" opacity="0.22"/>
                  <line x1="20"  y1="-20" x2="-20" y2="20" stroke={C.brown} strokeWidth="0.4" opacity="0.22"/>
                  <polygon points="0,-28 -5,-11 5,-11" fill={C.gold} opacity="0.9"/>
                  <polygon points="0,28 -5,11 5,11" fill="none" stroke={C.brown} strokeWidth="0.9" opacity="0.4"/>
                  <text x="0" y="-35" textAnchor="middle" fontSize="9.5"
                    fontFamily="Outfit, sans-serif" fill={C.gold} opacity="0.9" letterSpacing="2">N</text>
                </motion.g>
              )}

              {/* Legend — bottom-left cream margin */}
              {inView && (
                <motion.g transform="translate(52, 680)"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 3.2, duration: 1 }}
                >
                  {/* Trail legend */}
                  <line x1="0" y1="0" x2="28" y2="0" stroke={C.gold} strokeWidth="1.1" strokeDasharray="4,6" opacity="0.8"/>
                  <text x="34" y="4" fontFamily="Outfit, sans-serif" fontSize="8" fill={C.brown} opacity="0.55" letterSpacing="0.08em">
                    TRILHAS EXCLUSIVAS
                  </text>
                  {/* Point legend */}
                  <circle cx="10" cy="20" r="4.5" fill="none" stroke={C.gold} strokeWidth="1" opacity="0.8"/>
                  <circle cx="10" cy="20" r="1.5" fill={C.gold} opacity="0.9"/>
                  <text x="20" y="24" fontFamily="Outfit, sans-serif" fontSize="8" fill={C.brown} opacity="0.55" letterSpacing="0.08em">
                    Pontos de Interesse
                  </text>
                </motion.g>
              )}
            </motion.g>

            {/* Vignette */}
            <rect width={VW} height={VH} fill="url(#vig)" pointerEvents="none"/>
          </svg>

          {/* ── HTML Popover ── */}
          <AnimatePresence>
            {active && (
              <motion.div key={active.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: `${(active.x / VW) * 100}%`,
                  top:  `${(active.y / VH) * 100}%`,
                  transform: 'translate(-50%, -145%)',
                  pointerEvents: 'none',
                  zIndex: 30,
                }}
              >
                <div style={{
                  width: '200px',
                  background: C.bg,
                  padding: '15px 18px',
                  borderTop: `2px solid ${C.gold}`,
                  boxShadow: '0 16px 56px rgba(42,30,23,0.2), 0 2px 8px rgba(42,30,23,0.08)',
                }}>
                  <p style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, margin: '0 0 7px 0', fontFamily: 'Outfit, sans-serif' }}>
                    {active.name}
                  </p>
                  {active.sub.split('\n').map((line, i) => (
                    <p key={i} style={{ fontSize: '11px', color: C.brown, lineHeight: 1.6, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', opacity: 0.75, margin: 0 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Legend row */}
      <div className="container mx-auto px-6 mt-14 text-center">
        <div className="flex flex-wrap justify-center gap-8 md:gap-20">
          {[
            { label: 'Trilhas Exclusivas',     dash: true  },
            { label: 'Pontos de Interesse',    dash: false },
            { label: 'Áreas Naturais',         dash: false },
            { label: 'Experiências Privativas', dash: false },
          ].map(({ label, dash }) => (
            <div key={label} className="flex items-center gap-3">
              {dash
                ? <div className="w-5 h-px border-t border-dashed" style={{ borderColor: `${C.gold}80` }}/>
                : <div className="w-2 h-2 rounded-full" style={{ background: C.gold, opacity: 0.6 }}/>
              }
              <span className="text-[9.5px] uppercase tracking-[0.28em]" style={{ color: `${C.brown}55` }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
