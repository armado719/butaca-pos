interface Props {
  size?: number;
  variant?: 'full' | 'icon';
  /** 'dark' = sobre fondo oscuro (elementos blancos), 'light' = sobre fondo claro (elementos oscuros) */
  theme?: 'dark' | 'light';
  className?: string;
}

export const ButacaLogo = ({ size = 120, variant = 'full', theme = 'light', className = '' }: Props) => {
  const deco  = theme === 'dark' ? '#ffffff' : '#3a3a3a'; // líneas y corchetes
  const sub   = theme === 'dark' ? '#cccccc' : '#555555'; // textos secundarios
  const blade = theme === 'dark' ? '#ffffff' : '#2a2a2a'; // cubiertos

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M50 4 L90 26 L90 74 L50 96 L10 74 L10 26 Z"
          fill={theme === 'dark' ? '#1a0a0a' : '#fff'}
          stroke="#B5201E" strokeWidth="3"/>
        {/* Tenedor */}
        <line x1="40" y1="20" x2="40" y2="30" stroke={blade} strokeWidth="2" strokeLinecap="round"/>
        <line x1="44" y1="20" x2="44" y2="30" stroke={blade} strokeWidth="2" strokeLinecap="round"/>
        <line x1="48" y1="20" x2="48" y2="30" stroke={blade} strokeWidth="2" strokeLinecap="round"/>
        <line x1="44" y1="30" x2="44" y2="55" stroke={blade} strokeWidth="2.5" strokeLinecap="round"/>
        {/* Cuchillo */}
        <line x1="58" y1="20" x2="58" y2="55" stroke={blade} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M58 20 Q65 28 58 36" fill={blade}/>
        {/* BUTACA */}
        <text x="50" y="74" textAnchor="middle" fill="#B5201E"
          fontSize="13" fontWeight="900" fontFamily="Impact, sans-serif" letterSpacing="1">BUTACA</text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 240 276" className={className} xmlns="http://www.w3.org/2000/svg">

      {/* Líneas horizontales superiores */}
      <line x1="20"  y1="52" x2="88"  y2="52" stroke={deco} strokeWidth="1.5"/>
      <line x1="152" y1="52" x2="220" y2="52" stroke={deco} strokeWidth="1.5"/>
      {/* Corchetes superior izquierdo */}
      <polyline points="20,52 20,38 34,38"   fill="none" stroke={deco} strokeWidth="1.5"/>
      {/* Corchete superior derecho */}
      <polyline points="220,52 220,38 206,38" fill="none" stroke={deco} strokeWidth="1.5"/>

      {/* ── CUBIERTOS ── */}
      {/* Tenedor */}
      <g transform="translate(92, 14) rotate(-22)">
        <rect x="-2" y="0" width="4" height="40" rx="2" fill={blade}/>
        <rect x="-7" y="0" width="3" height="18" rx="1.5" fill={blade}/>
        <rect x="5"  y="0" width="3" height="18" rx="1.5" fill={blade}/>
        <rect x="-1" y="16" width="2" height="6" fill={blade}/>
      </g>
      {/* Cuchillo */}
      <g transform="translate(148, 14) rotate(22)">
        <rect x="-2" y="0" width="4" height="40" rx="2" fill={blade}/>
        <path d="M2,0 Q14,9 14,23 L2,23 Z" fill={blade}/>
      </g>

      {/* DESDE / 2010 */}
      <text x="62"  y="48" textAnchor="middle" fill={sub}
        fontSize="9" fontFamily="Arial, sans-serif" letterSpacing="3">DESDE</text>
      <text x="178" y="48" textAnchor="middle" fill={sub}
        fontSize="9" fontFamily="Arial, sans-serif" letterSpacing="3">2010</text>

      {/* ── BUTACA ── */}
      <text x="120" y="148" textAnchor="middle"
        fill="#B5201E" fontSize="88" fontWeight="900"
        fontFamily="Impact, Arial Narrow, sans-serif" letterSpacing="-2">
        BUTACA
      </text>

      {/* Línea divisoria */}
      <line x1="18" y1="162" x2="222" y2="162" stroke={deco} strokeWidth="1"/>

      {/* LA COMIDA DE SIEMPRE */}
      <text x="120" y="178" textAnchor="middle"
        fill={sub} fontSize="10" fontFamily="Arial, sans-serif" letterSpacing="5">
        LA COMIDA DE SIEMPRE
      </text>

      {/* Corchetes inferiores */}
      <polyline points="20,182 20,196 34,196"   fill="none" stroke={deco} strokeWidth="1.5"/>
      <polyline points="220,182 220,196 206,196" fill="none" stroke={deco} strokeWidth="1.5"/>

      {/* Líneas diagonales cruzadas */}
      <line x1="18"  y1="222" x2="72"  y2="196" stroke={deco} strokeWidth="1.2"/>
      <line x1="222" y1="222" x2="168" y2="196" stroke={deco} strokeWidth="1.2"/>

      {/* Flor decorativa */}
      <g transform="translate(120, 224)">
        {[0,45,90,135,180,225,270,315].map((angle, i) => (
          <ellipse key={i}
            cx={Math.cos((angle * Math.PI) / 180) * 8}
            cy={Math.sin((angle * Math.PI) / 180) * 8}
            rx="4" ry="2.5"
            fill={i % 2 === 0 ? '#B5201E' : '#8B1515'}
            transform={`rotate(${angle}, ${Math.cos((angle*Math.PI)/180)*8}, ${Math.sin((angle*Math.PI)/180)*8})`}
          />
        ))}
        <circle cx="0" cy="0" r="3" fill="#B5201E"/>
      </g>

      {/* Línea base */}
      <line x1="40" y1="250" x2="200" y2="250" stroke={deco} strokeWidth="1"/>
    </svg>
  );
};
