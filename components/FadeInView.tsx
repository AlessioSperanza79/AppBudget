// Animazione di ingresso (dissolvenza + leggero slide) per dare dinamicità a card e grafici al primo render
import { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export default function FadeInView({
  children, style, ritardo = 0, distanza = 16,
}: { children: React.ReactNode; style?: StyleProp<ViewStyle>; ritardo?: number; distanza?: number }) {
  const opacita = useRef(new Animated.Value(0)).current;
  const traslazione = useRef(new Animated.Value(distanza)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacita, { toValue: 1, duration: 420, delay: ritardo, useNativeDriver: true }),
      Animated.timing(traslazione, { toValue: 0, duration: 420, delay: ritardo, useNativeDriver: true }),
    ]).start();
  }, [opacita, traslazione, ritardo]);

  return (
    <Animated.View style={[style, { opacity: opacita, transform: [{ translateY: traslazione }] }]}>
      {children}
    </Animated.View>
  );
}
