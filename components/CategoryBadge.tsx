import { View, Text, StyleSheet } from 'react-native';

interface Props {
  nome: string;
  colore: string;
}

// Visualizza un piccolo punto colorato affiancato dal nome della categoria
export default function CategoryBadge({ nome, colore }: Props) {
  return (
    <View style={stili.riga}>
      <View style={[stili.punto, { backgroundColor: colore }]} />
      <Text style={stili.nome}>{nome}</Text>
    </View>
  );
}

const stili = StyleSheet.create({
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
    color: '#0F172A',
    fontWeight: '500',
  },
});
