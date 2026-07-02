// ── Illustrazione line-art per l'empty state "nessun obiettivo di risparmio" ──
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { Tema } from '../../constants/tema';

export default function IllustrazioneObiettivo({ t, size = 140 }: { t: Tema; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={62} cy={66} r={48} fill={t.entrataSfondo} />
      <Circle cx={32} cy={36} r={14} fill={t.violaSfondo} />

      <Ellipse cx={60} cy={94} rx={24} ry={7} fill={t.superfice} stroke={t.bordo} strokeWidth={1.5} />

      <Line x1={60} y1={30} x2={60} y2={94} stroke={t.titolo} strokeWidth={3} strokeLinecap="round" />
      <Path d="M60 32 L92 44 L60 56 Z" fill={t.primario} />

      <Circle cx={38} cy={78} r={9} fill={t.arancio} />
      <Circle cx={38} cy={78} r={3.5} fill="#FFFFFF" />
    </Svg>
  );
}
