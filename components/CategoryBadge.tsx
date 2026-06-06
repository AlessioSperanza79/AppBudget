import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTema, Tema } from '../constants/tema';

interface Props {
  nome: string;
  colore: string;
}

export default function CategoryBadge({ nome, colore }: Props) {
  const t = useTema();
  const stili = useMemo(() => creaStili(t), [t]);

  return (
    <View style={stili.riga}>
      <View style={[stili.punto, { backgroundColor: colore }]} />
      <Text style={stili.nome}>{nome}</Text>
    </View>
  );
}

function creaStili(t: Tema) {
  return StyleSheet.create({
    riga: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    punto: {
      width: 9,
      height: 9,
      borderRadius: 5,
      flexShrink: 0,
    },
    nome: {
      fontSize: 13,
      color: t.titolo,
      fontWeight: '500',
    },
  });
}
