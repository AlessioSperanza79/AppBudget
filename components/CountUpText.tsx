// Anima la transizione di un valore numerico, riformattandolo ad ogni frame (es. con formatEuro)
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, Text, TextProps, TextStyle } from 'react-native';

interface ProprietaCountUpText extends Omit<TextProps, 'style' | 'children'> {
  valore: number;
  formatta: (n: number) => string;
  durata?: number;
  style?: StyleProp<TextStyle>;
}

export default function CountUpText({ valore, formatta, durata = 700, style, ...resto }: ProprietaCountUpText) {
  const animato = useRef(new Animated.Value(valore)).current;
  const precedente = useRef(valore);
  const [testo, setTesto] = useState(() => formatta(valore));

  useEffect(() => {
    if (precedente.current === valore) return;
    const partenza = precedente.current;
    precedente.current = valore;
    animato.setValue(partenza);

    const listenerId = animato.addListener(({ value }) => setTesto(formatta(value)));
    Animated.timing(animato, { toValue: valore, duration: durata, useNativeDriver: false }).start();

    return () => animato.removeListener(listenerId);
  }, [valore]);

  return <Text style={style} {...resto}>{testo}</Text>;
}
