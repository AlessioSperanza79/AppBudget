// ── Sottile barra di caricamento in cima allo schermo, legata a caricamento di useFinanceStore ──
// Copre i ricaricamenti non già segnalati da un RefreshControl (es. dopo un salvataggio che
// ricarica tutto, o una riconnessione dopo un periodo offline)
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTema } from '../constants/tema';

export default function BarraCaricamento() {
  const caricamento = useFinanceStore((s) => s.caricamento);
  const t = useTema();
  const opacita = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacita, {
      toValue: caricamento ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [caricamento]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[stili.barra, { backgroundColor: t.primario, opacity: opacita }]}
    />
  );
}

const stili = StyleSheet.create({
  barra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2000,
    elevation: 2000,
  },
});
