// ── Diagramma di flusso "a sorgente singola": dalle entrate verso le categorie di spesa + risparmio ──
// react-native-gifted-charts non supporta i Sankey, quindi si disegna a mano con react-native-svg
// (già usata direttamente altrove, es. components/illustrazioni/IllustrazioneObiettivo.tsx)
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Tema } from '../../constants/tema';

export interface NodoSankey {
  nome: string;
  valore: number;
  colore: string;
}

interface Props {
  entrate: number;
  destinazioni: NodoSankey[]; // categorie di uscita + risparmio, in quest'ordine
  t: Tema;
  larghezza: number;
}

const LARGHEZZA_NODO = 10;
const GAP = 5;
const ALTEZZA_RIGA = 30;
const ALTEZZA_MINIMA = 160;

export default function SankeyFlusso({ entrate, destinazioni, t, larghezza }: Props) {
  if (entrate <= 0 || destinazioni.length === 0) return null;

  const altezza = Math.max(ALTEZZA_RIGA * destinazioni.length, ALTEZZA_MINIMA);
  const innerH = altezza - GAP * (destinazioni.length - 1);
  const xDestinazione = larghezza - LARGHEZZA_NODO;
  const midX = (LARGHEZZA_NODO + xDestinazione) / 2;

  // Il nodo sorgente ("Entrate") è una barra unica e continua (nessun gap tra i segmenti,
  // stesso colore): la banda di ciascuna destinazione parte da una porzione contigua di essa
  // e converge, con gap tra loro, sul rispettivo nodo colorato a destra
  let yLeft = 0;
  let yRight = 0;
  const segmenti = destinazioni.map((nodo) => {
    const h = Math.max((nodo.valore / entrate) * innerH, 1);
    const s = { nodo, y0Left: yLeft, y1Left: yLeft + h, y0Right: yRight, y1Right: yRight + h };
    yLeft += h;
    yRight += h + GAP;
    return s;
  });

  return (
    <View>
      <Svg width={larghezza} height={altezza}>
        <Rect x={0} y={0} width={LARGHEZZA_NODO} height={yLeft} rx={3} fill={t.entrata} />
        {segmenti.map((s, i) => (
          <Path
            key={`banda-${i}`}
            d={`M ${LARGHEZZA_NODO} ${s.y0Left}
                C ${midX} ${s.y0Left}, ${midX} ${s.y0Right}, ${xDestinazione} ${s.y0Right}
                L ${xDestinazione} ${s.y1Right}
                C ${midX} ${s.y1Right}, ${midX} ${s.y1Left}, ${LARGHEZZA_NODO} ${s.y1Left}
                Z`}
            fill={s.nodo.colore}
            fillOpacity={0.4}
          />
        ))}
        {segmenti.map((s, i) => (
          <Rect
            key={`nodo-${i}`}
            x={xDestinazione}
            y={s.y0Right}
            width={LARGHEZZA_NODO}
            height={s.y1Right - s.y0Right}
            rx={3}
            fill={s.nodo.colore}
          />
        ))}
      </Svg>
    </View>
  );
}
