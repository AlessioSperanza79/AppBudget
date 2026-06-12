// Foglio che scivola dal basso: si chiude toccando lo sfondo o trascinando verso il basso la maniglia
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, PanResponder, StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle,
} from 'react-native';
import { Tema, useTema } from '../constants/tema';

interface ProprietaBottomSheet {
  visibile: boolean;
  onChiudi: () => void;
  children: React.ReactNode;
  altezza?: number | `${number}%`;
  stile?: StyleProp<ViewStyle>;
}

const { height: ALTEZZA_SCHERMO } = Dimensions.get('window');
const SOGLIA_CHIUSURA = 120;

export default function BottomSheet({ visibile, onChiudi, children, altezza, stile }: ProprietaBottomSheet) {
  const t = useTema();
  const stili = creaStili(t);
  const traslazione = useRef(new Animated.Value(ALTEZZA_SCHERMO)).current;
  const opacitaBackdrop = useRef(new Animated.Value(0)).current;
  const [renderizzato, setRenderizzato] = useState(visibile);

  useEffect(() => {
    if (visibile) {
      setRenderizzato(true);
      traslazione.setValue(ALTEZZA_SCHERMO);
      opacitaBackdrop.setValue(0);
      Animated.parallel([
        Animated.spring(traslazione, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 14 }),
        Animated.timing(opacitaBackdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (renderizzato) {
      Animated.parallel([
        Animated.timing(traslazione, { toValue: ALTEZZA_SCHERMO, duration: 200, useNativeDriver: true }),
        Animated.timing(opacitaBackdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setRenderizzato(false));
    }
  }, [visibile]);

  // Trascinando la maniglia verso il basso oltre la soglia si chiude il foglio
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesto) => gesto.dy > 6 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
      onPanResponderMove: (_, gesto) => {
        if (gesto.dy > 0) traslazione.setValue(gesto.dy);
      },
      onPanResponderRelease: (_, gesto) => {
        if (gesto.dy > SOGLIA_CHIUSURA || gesto.vy > 1.2) onChiudi();
        else Animated.spring(traslazione, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 14 }).start();
      },
    })
  ).current;

  if (!renderizzato) return null;

  return (
    <View style={stili.contenitore}>
      <TouchableWithoutFeedback onPress={onChiudi}>
        <Animated.View style={[stili.backdrop, { opacity: opacitaBackdrop }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[stili.foglio, altezza != null && { height: altezza }, stile, { transform: [{ translateY: traslazione }] }]}>
        <View {...panResponder.panHandlers} style={stili.maniglia}>
          <View style={stili.barraManiglia} />
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    contenitore: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      elevation: 999,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    foglio: {
      backgroundColor: t.carta,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      maxHeight: '90%',
      shadowColor: t.ombra,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 12,
    },
    maniglia: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    barraManiglia: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.bordo,
    },
  });
}
