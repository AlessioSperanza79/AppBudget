// ── Illustrazione line-art per l'empty state "nessuna transazione" ──
import Svg, { Circle, Rect, Line } from 'react-native-svg';
import { Tema } from '../../constants/tema';

export default function IllustrazioneMovimenti({ t, size = 140 }: { t: Tema; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={64} r={48} fill={t.primarioSfondo} />
      <Circle cx={88} cy={34} r={15} fill={t.arancioSfondo} />

      <Rect x={30} y={34} width={60} height={72} rx={10} fill={t.carta} stroke={t.primario} strokeWidth={2.5} />

      <Line x1={42} y1={54} x2={78} y2={54} stroke={t.piuSottile} strokeWidth={3} strokeLinecap="round" />
      <Line x1={42} y1={68} x2={70} y2={68} stroke={t.piuSottile} strokeWidth={3} strokeLinecap="round" />
      <Line x1={42} y1={82} x2={62} y2={82} stroke={t.bordo} strokeWidth={3} strokeLinecap="round" />

      <Circle cx={84} cy={92} r={12} fill={t.arancio} />
      <Line x1={84} y1={87} x2={84} y2={97} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={79} y1={92} x2={89} y2={92} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
