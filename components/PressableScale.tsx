// Wrapper che applica un leggero effetto di "pressione" (scala) ai bottoni, per dare profondità senza librerie native extra
import { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface ProprietaPressableScale extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  scalaMinima?: number;
  children?: React.ReactNode;
}

export default function PressableScale({
  style, scalaMinima = 0.94, onPressIn, onPressOut, children, ...resto
}: ProprietaPressableScale) {
  const scala = useRef(new Animated.Value(1)).current;

  const gestisciPressIn = (e: GestureResponderEvent) => {
    Animated.spring(scala, { toValue: scalaMinima, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
    onPressIn?.(e);
  };

  const gestisciPressOut = (e: GestureResponderEvent) => {
    Animated.spring(scala, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={gestisciPressIn} onPressOut={gestisciPressOut} {...resto}>
      <Animated.View style={[style, { transform: [{ scale: scala }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
